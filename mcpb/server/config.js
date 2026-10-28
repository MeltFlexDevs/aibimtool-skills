import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
// Where the API key lives: AIBIMTOOL_API_KEY wins over ~/.aibimtool/config.json,
// so an MCP client's env block, a container or a CI job works with no login.
const CONFIG_DIR = join(homedir(), ".aibimtool");
export const CONFIG_PATH = join(CONFIG_DIR, "config.json");
export const DEFAULT_BASE_URL = "https://aibimtool.com";
/** What a key looks like; mirrors lib/developer/constants.ts in the app. */
export const KEY_PREFIX = "aibim_sk_";
function readFile() {
    if (!existsSync(CONFIG_PATH))
        return {};
    try {
        return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    }
    catch {
        return {}; // a corrupt file must not stop an env-configured run
    }
}
export function loadConfig() {
    const file = readFile();
    return {
        apiKey: process.env.AIBIMTOOL_API_KEY || file.apiKey,
        baseUrl: (process.env.AIBIMTOOL_BASE_URL || file.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, ""),
    };
}
/** Saves the key with owner-only permissions, set on the write itself so it is never readable by others. */
export function saveApiKey(apiKey) {
    if (!existsSync(CONFIG_DIR))
        mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    writeFileSync(CONFIG_PATH, JSON.stringify({ ...readFile(), apiKey }, null, 2), { mode: 0o600 });
    try {
        chmodSync(CONFIG_PATH, 0o600);
    }
    catch { }
    return CONFIG_PATH;
}
export function clearApiKey() {
    const file = readFile();
    if (!file.apiKey)
        return false;
    delete file.apiKey;
    writeFileSync(CONFIG_PATH, JSON.stringify(file, null, 2), { mode: 0o600 });
    return true;
}
/** The package version: ../package.json from dist/, ./package.json in the desktop extension's copy. */
export function packageVersion() {
    for (const rel of ["../package.json", "./package.json"]) {
        try {
            return JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8")).version;
        }
        catch { }
    }
    return "0.0.0";
}
