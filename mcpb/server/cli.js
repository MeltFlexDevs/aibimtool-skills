#!/usr/bin/env node
import { ApiError, Client } from "./api.js";
import { loginViaBrowser } from "./auth-login.js";
import { clearApiKey, CONFIG_PATH, loadConfig, packageVersion, saveApiKey } from "./config.js";
import { describe, writeOutput } from "./util.js";
// One binary: an MCP server on stdio with no arguments (what an MCP client
// starts), the CLI with them. Exit codes: 0 done · 1 error · 2 out of credits
// or a plan is needed · 3 the agent waits for an answer or an approval.
const VERSION = packageVersion();
const HELP = `aibimtool ${VERSION}: design buildings as IFC4 BIM models from a brief.

Usage
  aibimtool auth login               sign in through the browser (stores a key)
  aibimtool auth logout              forget the stored key
  aibimtool whoami                   account, plan and credits
  aibimtool credits                  credits left
  aibimtool build "<brief>"          start a new building
  aibimtool send <id> "<message>"    answers, a change or a follow-up
  aibimtool approve <id>             the go-ahead for the agent's plan
  aibimtool continue <id>            go on after a time limit
  aibimtool status <id>              state, reply, questions, plan
  aibimtool projects                 list projects
  aibimtool ifc <id> [-o file.ifc]   download the IFC4 model
  aibimtool image <id> [--view plan --storey 1] [-o file.png]
  aibimtool stop <id>                stop the running agent
  aibimtool delete <id>              delete a project
  aibimtool mcp                      run the MCP server (also: no arguments)

Options
  --wait           follow the run until the agent finishes or needs you
  --yes            with --wait: approve plans by yourself
  --ifc <file>     with build/send --wait: download the IFC when it is ready
  --level <l>      easy | medium | high (High needs a paid plan)
  --title <t>      a name for a new project
  --storey <s>     with image: one storey's plan (its name, or 0 for the ground floor)
  --json           print JSON instead of text

Environment
  AIBIMTOOL_API_KEY   a key (aibim_sk_…); wins over ${CONFIG_PATH}
  AIBIMTOOL_BASE_URL  another server, for testing

Docs: https://aibimtool.com/developers`;
function parse(argv) {
    const args = [];
    const flags = { wait: false, yes: false, json: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        const value = () => {
            const v = argv[++i];
            if (v === undefined)
                throw new Error(`${a} needs a value`);
            return v;
        };
        if (a === "--wait" || a === "-w")
            flags.wait = true;
        else if (a === "--yes" || a === "-y")
            flags.yes = true;
        else if (a === "--json")
            flags.json = true;
        else if (a === "--ifc")
            flags.ifc = value();
        else if (a === "-o" || a === "--output")
            flags.out = value();
        else if (a === "--title")
            flags.title = value();
        else if (a === "--view")
            flags.view = value() === "plan" ? "plan" : "iso";
        else if (a === "--storey")
            flags.storey = value();
        else if (a === "--level") {
            const l = value();
            if (l !== "easy" && l !== "medium" && l !== "high")
                throw new Error("--level is easy, medium or high");
            flags.level = l;
        }
        else
            args.push(a);
    }
    return { args, flags };
}
const print = (flags, p) => console.log(flags.json ? JSON.stringify(p, null, 2) : describe(p));
/** Follows a project to the end of the run, approving plans with --yes; returns the exit code. */
async function finish(c, p, flags) {
    if (!flags.wait) {
        print(flags, p);
        return 0;
    }
    for (;;) {
        if (!flags.json)
            console.error(`… ${p.title}: ${p.state}${p.elements ? `, ${p.elements} elements` : ""}`);
        p = await c.follow(p.id, { onUpdate: (u) => !flags.json && u.state === "running" && console.error(`… running${u.elements ? `, ${u.elements} elements` : ""}`) });
        if (p.state === "needs_approval" && flags.yes) {
            if (!flags.json)
                console.error(`… approving the plan (${p.plan?.length ?? 0} tasks)`);
            p = await c.send(p.id, { approvePlan: true });
            continue;
        }
        break;
    }
    print(flags, p);
    if (p.state === "ready" && flags.ifc) {
        const path = writeOutput(await c.ifc(p.id), p.title, "ifc", flags.ifc);
        console.error(`IFC written to ${path}`);
    }
    if (p.state === "needs_answer" || p.state === "needs_approval")
        return 3;
    if (p.state === "out_of_credits")
        return 2;
    return p.state === "ready" ? 0 : 1;
}
async function main(argv) {
    if (argv.length === 0 || argv[0] === "mcp") {
        const { startServer } = await import("./server.js");
        await startServer();
        return -1; // keeps running
    }
    if (argv[0] === "--help" || argv[0] === "-h" || argv[0] === "help") {
        console.log(HELP);
        return 0;
    }
    if (argv[0] === "--version" || argv[0] === "-v") {
        console.log(VERSION);
        return 0;
    }
    const { args, flags } = parse(argv);
    const [command, ...rest] = args;
    const need = (n, usage) => {
        if (rest.length < n)
            throw new Error(`Usage: aibimtool ${usage}`);
    };
    if (command === "auth") {
        if (rest[0] === "login") {
            const key = await loginViaBrowser(loadConfig().baseUrl);
            const path = saveApiKey(key);
            const me = await new Client({ apiKey: key }).me();
            console.log(`Signed in as ${me.account.email ?? me.account.id}. Key saved to ${path}`);
            return 0;
        }
        if (rest[0] === "logout") {
            console.log(clearApiKey() ? `Removed the key from ${CONFIG_PATH}. Revoke it under Developers → API keys if it is no longer needed.` : "No key was stored.");
            return 0;
        }
        throw new Error("Usage: aibimtool auth login | logout");
    }
    const c = new Client();
    switch (command) {
        case "whoami":
        case "credits": {
            const me = await c.me();
            if (flags.json)
                console.log(JSON.stringify(me, null, 2));
            else if (command === "credits")
                console.log(`${me.credits.available} credits`);
            else
                console.log(`${me.account.email ?? me.account.id}\nPlan: ${me.plan ?? "none"}\nCredits: ${me.credits.available}\n${me.metering.note}`);
            return 0;
        }
        case "build": {
            need(1, 'build "<brief>" [--wait] [--yes] [--ifc file.ifc]');
            return finish(c, await c.create({ message: rest.join(" "), title: flags.title, level: flags.level }), flags);
        }
        case "send": {
            need(2, 'send <id> "<message>" [--wait]');
            return finish(c, await c.send(rest[0], { message: rest.slice(1).join(" "), level: flags.level }), flags);
        }
        case "approve":
            need(1, "approve <id> [--wait]");
            return finish(c, await c.send(rest[0], { approvePlan: true }), flags);
        case "continue":
            need(1, "continue <id> [--wait]");
            return finish(c, await c.send(rest[0], { continue: true }), flags);
        case "status": {
            need(1, "status <id> [--wait]");
            return finish(c, await c.status(rest[0]), flags);
        }
        case "projects": {
            const list = await c.projects();
            if (flags.json)
                console.log(JSON.stringify(list, null, 2));
            else
                console.log(list.length ? list.map((p) => `${p.id}  ${p.title}  (${p.elements} elements)`).join("\n") : "No projects yet.");
            return 0;
        }
        case "ifc": {
            need(1, "ifc <id> [-o file.ifc]");
            const p = await c.status(rest[0]);
            console.log(writeOutput(await c.ifc(rest[0]), p.title, "ifc", flags.out));
            return 0;
        }
        case "image": {
            need(1, "image <id> [--view plan --storey 1] [-o file.png]");
            const view = flags.storey !== undefined ? "plan" : flags.view;
            console.log(writeOutput(await c.image(rest[0], view, flags.storey), `${rest[0]}-${view ?? "iso"}${flags.storey !== undefined ? `-storey-${flags.storey}` : ""}`, "png", flags.out));
            return 0;
        }
        case "stop":
            need(1, "stop <id>");
            await c.stop(rest[0]);
            console.log("Stopping after the current step.");
            return 0;
        case "delete":
            need(1, "delete <id>");
            await c.remove(rest[0]);
            console.log(`Deleted ${rest[0]}.`);
            return 0;
        default:
            throw new Error(`Unknown command "${command}". Run aibimtool --help.`);
    }
}
main(process.argv.slice(2)).then((code) => {
    if (code >= 0)
        process.exit(code);
}, (err) => {
    console.error(`aibimtool: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(err instanceof ApiError && err.billing ? 2 : 1);
});
