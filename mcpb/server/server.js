import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ApiError, Client } from "./api.js";
import { loginViaBrowser } from "./auth-login.js";
import { loadConfig, packageVersion, saveApiKey } from "./config.js";
import { describe, writeOutput } from "./util.js";
// The local MCP server (stdio): the hosted server's tools (aibimtool.com/mcp)
// for an agent with a filesystem and an API key. Files are written to disk and
// returned as paths. stdout is the JSON-RPC channel: anything for a person goes
// to stderr.
const VERSION = packageVersion();
const INSTRUCTIONS = "AIBIMTool designs buildings as real BIM models: an AI architect turns a brief into an IFC4 model with storeys, walls, " +
    "slabs, doors, windows, rooms, stairs and a roof. Start a design only when the user asked for one, with the brief in their " +
    "own words. Credits belong to the user's AIBIMTool account.\n\n" +
    "Flow: create_building returns at once; call get_project_status (it waits while the agent runs) until state leaves " +
    "running, 3-15 minutes. needs_answer → put the agent's questions to the user and send_message the answers; " +
    "needs_approval → show the plan, approve_plan once the user agrees; needs_continue → continue_building; " +
    "ready → get_ifc_download writes the IFC to disk, get_model_image shows it. Changes go to the same project with send_message. " +
    "out_of_credits or a plan error → tell the user; do not retry.";
const ok = (text) => ({ content: [{ type: "text", text }] });
const fail = (text) => ({ isError: true, content: [{ type: "text", text }] });
// A key from the environment or the config file; signs in through the browser on first use.
let client = null;
async function api() {
    if (client)
        return client;
    if (!loadConfig().apiKey) {
        const key = await loginViaBrowser(loadConfig().baseUrl);
        saveApiKey(key);
    }
    client = new Client();
    return client;
}
/** Runs a tool, its failures as a tool error the agent reads rather than a protocol error. */
async function run(work) {
    try {
        return await work();
    }
    catch (err) {
        if (err instanceof ApiError)
            return fail(`${err.message} (${err.code})`);
        return fail(err instanceof Error ? err.message : String(err));
    }
}
const projectId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).describe("The project's id, as create_building or list_projects returned it.");
const level = z.enum(["easy", "medium", "high"]).optional().describe("easy is quickest and cheapest, high the most careful (paid plans). Default medium.");
const outputPath = z.string().optional().describe("A file or folder to write to. Default ./aibimtool-output/.");
const project = (p) => ok(describe(p));
export async function startServer() {
    const server = new McpServer({ name: "aibimtool", version: VERSION }, { instructions: INSTRUCTIONS });
    server.registerTool("create_building", {
        title: "Design a building",
        description: "Start designing a new building from a brief; the agent may ask questions or propose a plan, then builds an IFC4 model. Returns a project_id at once. Spends credits (metered, failed runs refunded).",
        inputSchema: { brief: z.string().min(1).max(8000).describe("The design brief in the user's words."), title: z.string().max(80).optional(), level },
    }, async ({ brief, title, level }) => run(async () => project(await (await api()).create({ message: brief, title, level }))));
    server.registerTool("send_message", {
        title: "Message the architect",
        description: "The next message to a project's agent: answers to its questions, a change, or a follow-up. Spends credits.",
        inputSchema: { project_id: projectId, message: z.string().min(1).max(8000), level },
    }, async ({ project_id, message, level }) => run(async () => project(await (await api()).send(project_id, { message, level }))));
    server.registerTool("approve_plan", { title: "Approve the plan", description: "The go-ahead for the agent's plan (state needs_approval), once the user agreed. Spends credits.", inputSchema: { project_id: projectId } }, async ({ project_id }) => run(async () => project(await (await api()).send(project_id, { approvePlan: true }))));
    server.registerTool("continue_building", { title: "Continue building", description: "Go on after a run stopped at its time limit (state needs_continue). Spends credits.", inputSchema: { project_id: projectId } }, async ({ project_id }) => run(async () => project(await (await api()).send(project_id, { continue: true }))));
    server.registerTool("get_project_status", {
        title: "Project status",
        description: "State, the agent's reply, questions, plan and element count. Waits up to wait_seconds while the agent runs; call it in a loop until state is not running.",
        inputSchema: { project_id: projectId, wait_seconds: z.number().int().min(0).max(50).optional().describe("Default 30.") },
    }, async ({ project_id, wait_seconds }) => run(async () => project(await (await api()).status(project_id, wait_seconds ?? 30))));
    server.registerTool("list_projects", { title: "List projects", description: "The account's projects, newest first.", inputSchema: {} }, async () => run(async () => {
        const list = await (await api()).projects();
        return ok(list.length ? list.map((p) => `${p.id}  ${p.title}  (${p.elements} elements, changed ${p.updatedAt})`).join("\n") : "No projects yet.");
    }));
    server.registerTool("get_model_image", {
        title: "Look at the model",
        description: "A PNG of the model, iso (3D) or plan (rooms named and measured), written to disk and shown. For a building with several storeys " +
            "pass `storey` with a plan, or every storey is drawn over the others. Free; up to a minute when the model is not loaded.",
        inputSchema: {
            project_id: projectId,
            view: z.enum(["iso", "plan"]).optional(),
            storey: z.union([z.string(), z.number().int()]).optional().describe('With view plan: the storey\'s name ("Level 2") or its number from the ground floor (0).'),
            output_path: outputPath,
        },
    }, async ({ project_id, view, storey, output_path }) => run(async () => {
        const c = await api();
        const png = await c.image(project_id, view ?? "iso", storey === undefined ? undefined : String(storey));
        const path = writeOutput(png, `${project_id}-${view ?? "iso"}${storey === undefined ? "" : `-storey-${storey}`}`, "png", output_path);
        return { content: [{ type: "image", data: png.toString("base64"), mimeType: "image/png" }, { type: "text", text: `Saved to ${path}` }] };
    }));
    server.registerTool("get_ifc_download", {
        title: "Download the IFC",
        description: "Write the model as an IFC4 file (Revit, ArchiCAD, BlenderBIM, Tekla, Navisworks) and return its path. Free.",
        inputSchema: { project_id: projectId, output_path: outputPath },
    }, async ({ project_id, output_path }) => run(async () => {
        const c = await api();
        const p = await c.status(project_id);
        const path = writeOutput(await c.ifc(project_id), p.title, "ifc", output_path);
        return ok(`IFC4 model of "${p.title}" (${p.elements} elements) written to ${path}`);
    }));
    server.registerTool("stop_building", { title: "Stop the agent", description: "Stop a running agent after its current step. The steps it took are charged.", inputSchema: { project_id: projectId } }, async ({ project_id }) => run(async () => (await (await api()).stop(project_id), ok("Stopping after the current step."))));
    server.registerTool("check_credits", { title: "Credits", description: "Plan and credits left, and how messages are charged.", inputSchema: {} }, async () => run(async () => {
        const me = await (await api()).me();
        return ok(`${me.account.email ?? "This account"}: ${me.plan ?? "no"} plan, ${me.credits.available} credits. ${me.metering.note}`);
    }));
    await server.connect(new StdioServerTransport());
    console.error(`aibimtool MCP server ${VERSION} ready on stdio`);
}
