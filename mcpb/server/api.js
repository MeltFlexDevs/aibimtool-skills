import { KEY_PREFIX, loadConfig } from "./config.js";
export class ApiError extends Error {
    status;
    code;
    constructor(message, status, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
    /** Out of credits, or a plan is needed: exit code 2, and nothing an agent should retry. */
    get billing() {
        return this.status === 402;
    }
}
export class Client {
    baseUrl;
    apiKey;
    constructor(opts = {}) {
        const config = loadConfig();
        const key = opts.apiKey ?? config.apiKey;
        if (!key) {
            throw new ApiError("No AIBIMTool API key. Run `npx -y aibimtool-mcp auth login`, or set AIBIMTOOL_API_KEY (create a key at aibimtool.com/dashboard/developers).", 401, "missing_api_key");
        }
        if (!key.startsWith(KEY_PREFIX))
            throw new ApiError(`That does not look like an AIBIMTool key (they start with ${KEY_PREFIX}).`, 401, "invalid_api_key");
        this.apiKey = key;
        this.baseUrl = (opts.baseUrl ?? config.baseUrl).replace(/\/$/, "");
    }
    async raw(method, path, body, timeoutMs = 90_000) {
        let res;
        try {
            res = await fetch(`${this.baseUrl}/api/v1${path}`, {
                method,
                headers: { Authorization: `Bearer ${this.apiKey}`, "User-Agent": "aibimtool-mcp", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: AbortSignal.timeout(timeoutMs),
            });
        }
        catch (err) {
            throw new ApiError(`Could not reach ${this.baseUrl}: ${err instanceof Error ? err.message : String(err)}`, 0, "network");
        }
        if (!res.ok && (res.headers.get("content-type") ?? "").includes("application/json")) {
            const data = (await res.json().catch(() => ({})));
            throw new ApiError(data.message ?? `HTTP ${res.status}`, res.status, data.error ?? "http_error");
        }
        if (!res.ok)
            throw new ApiError(`HTTP ${res.status} from ${path}`, res.status, "http_error");
        return res;
    }
    async json(method, path, body, timeoutMs) {
        const res = await this.raw(method, path, body, timeoutMs);
        return (await res.json());
    }
    me = () => this.json("GET", "/me");
    projects = async () => (await this.json("GET", "/projects")).projects;
    create = async (input) => (await this.json("POST", "/projects", input)).project;
    /** The project's status; `wait` (up to 50 s) holds the answer while the agent runs. */
    status = async (id, wait = 0) => (await this.json("GET", `/projects/${encodeURIComponent(id)}${wait ? `?wait=${wait}` : ""}`, undefined, (wait + 40) * 1000)).project;
    send = async (id, input) => (await this.json("POST", `/projects/${encodeURIComponent(id)}/messages`, input)).project;
    stop = (id) => this.json("POST", `/projects/${encodeURIComponent(id)}/stop`);
    remove = (id) => this.json("DELETE", `/projects/${encodeURIComponent(id)}`);
    ifc = async (id) => Buffer.from(await (await this.raw("GET", `/projects/${encodeURIComponent(id)}/ifc`)).arrayBuffer());
    /** A PNG of the model; a plan of one `storey` (its name, or its number from the ground floor, 0) reads best. */
    image = async (id, view = "iso", storey) => Buffer.from(await (await this.raw("GET", `/projects/${encodeURIComponent(id)}/image?view=${view}${storey !== undefined ? `&storey=${encodeURIComponent(storey)}` : ""}`, undefined, 300_000)).arrayBuffer());
    /**
     * Follows a project until it stops running, or until `untilMs`. Calls
     * `onUpdate` whenever the state changes. A run stopped at its time limit is
     * continued (the server normally does that itself; this is the fallback).
     */
    async follow(id, opts = {}) {
        const until = opts.untilMs ?? Date.now() + 60 * 60 * 1000;
        let last = "";
        for (;;) {
            let p = await this.status(id, 45);
            if (p.state === "needs_continue")
                p = await this.send(id, { continue: true });
            const mark = `${p.state}:${p.elements}`;
            if (mark !== last) {
                last = mark;
                opts.onUpdate?.(p);
            }
            if (p.state !== "running" || Date.now() > until)
                return p;
        }
    }
}
