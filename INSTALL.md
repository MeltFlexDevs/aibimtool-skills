# Install

Two separate things live in this repo, and you can take either or both.

- **Skills** are Markdown files that teach an agent how to use AIBIMTool well: what a brief needs, when to ask the user, how to handle the agent's plan, what to do with the IFC. They carry the judgement the tool schemas cannot.
- **The MCP server** is the actual command channel, with ten tools. It is hosted at `https://aibimtool.com/mcp` (sign in with your AIBIMTool account, every plan) and published on npm as [`aibimtool-mcp`](https://www.npmjs.com/package/aibimtool-mcp) for a local server with an API key (Starter or Studio).

Most people want both. The skills alone still work: they teach the agent to drive the CLI or the REST API instead.

## Skills

### `npx skills` (recommended, cross-agent)

```bash
npx skills add MeltFlexDevs/aibimtool-skills
```

Detects your agent and installs into the right place.

### GitHub CLI (v2.90+)

```bash
gh skill install MeltFlexDevs/aibimtool-skills
```

### Claude Code marketplace

```
/plugin marketplace add MeltFlexDevs/aibimtool-skills
/plugin install aibimtool@aibimtool
```

Then `/aibimtool:design` or `/aibimtool:bim`. The plugin also registers the hosted MCP server; run `/mcp` and Authenticate once.

### By hand

Copy the skill folders into wherever your agent reads skills from:

```bash
git clone --depth 1 https://github.com/MeltFlexDevs/aibimtool-skills.git
cp -r aibimtool-skills/skills/* ~/.claude/skills/          # Claude Code
```

## MCP server

Every client below can use either server. The **hosted** one is a URL and an OAuth sign-in; the **local** one is `npx -y aibimtool-mcp` with an API key, and writes IFC files to disk.

### Claude (claude.ai and Claude Desktop)

Settings, Connectors, Add custom connector. Name it AIBIMTool, URL `https://aibimtool.com/mcp`, then Connect and sign in.

For the local server instead: Settings, Developer, Edit Config, and the JSON block from Cursor below in `claude_desktop_config.json`. Restart the app afterwards. You can also install the packaged extension: build it with `npx @anthropic-ai/mcpb pack mcpb` and double-click the resulting `.mcpb`, which prompts for the API key rather than making you edit JSON.

### Claude Code

```bash
claude mcp add --transport http aibimtool https://aibimtool.com/mcp     # hosted, then /mcp → Authenticate
claude mcp add aibimtool -- npx -y aibimtool-mcp                        # local
```

### ChatGPT

Settings, Apps & Connectors, Advanced settings: turn on Developer mode. Create a connector with the URL `https://aibimtool.com/mcp` and OAuth authentication, then sign in.

### Cursor

`~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (per project). Hosted:

```json
{
  "mcpServers": {
    "aibimtool": { "url": "https://aibimtool.com/mcp" }
  }
}
```

Local:

```json
{
  "mcpServers": {
    "aibimtool": {
      "command": "npx",
      "args": ["-y", "aibimtool-mcp"],
      "env": { "AIBIMTOOL_API_KEY": "aibim_sk_..." }
    }
  }
}
```

### Codex

`~/.codex/config.toml`:

```toml
[mcp_servers.aibimtool]
command = "npx"
args = ["-y", "aibimtool-mcp"]
env = { AIBIMTOOL_API_KEY = "aibim_sk_..." }
```

### VS Code

`.vscode/mcp.json` in your workspace. Note the `servers` key rather than `mcpServers`:

```json
{
  "servers": {
    "aibimtool": { "type": "http", "url": "https://aibimtool.com/mcp" }
  }
}
```

or, local:

```json
{
  "servers": {
    "aibimtool": {
      "command": "npx",
      "args": ["-y", "aibimtool-mcp"],
      "env": { "AIBIMTOOL_API_KEY": "aibim_sk_..." }
    }
  }
}
```

### Windsurf

`~/.codeium/windsurf/mcp_config.json`, with `serverUrl` for the hosted server (`{ "mcpServers": { "aibimtool": { "serverUrl": "https://aibimtool.com/mcp" } } }`) or the same local block as Cursor. Then Cascade panel, MCP servers, Refresh.

### Cline and other agents

See [llms-install.md](./llms-install.md), written to be handed straight to the agent.

## Authenticate

The hosted server signs you in itself. The local server and the CLI need an API key, part of the **Starter** and **Studio** plans.

```bash
npx -y aibimtool-mcp auth login
```

That opens your browser, mints a key from your signed-in session and hands it back to the terminal over the loopback interface. Nothing is copied or pasted, so the key never reaches your shell history. It is stored at `~/.aibimtool/config.json` with owner-only permissions.

If you would rather manage it yourself, create a key at [aibimtool.com](https://aibimtool.com/dashboard/developers/api-keys) under Developers, API keys, and set `AIBIMTOOL_API_KEY`. An environment variable always beats the stored config, which is how CI jobs and containers avoid an interactive login.

Check it worked:

```bash
npx -y aibimtool-mcp whoami
npx -y aibimtool-mcp credits
```

## Troubleshooting

**"No AIBIMTool API key"**: run `aibimtool auth login`, or check the `env` block in your client config. Or use the hosted server, which needs no key.

**"The API needs an active Starter or Studio plan"**: the account has no plan. API keys come with Starter and Studio; the hosted server works without one.

**The hosted server asks to sign in again and again**: the client is not keeping the OAuth tokens. Remove the server and add it again; in Claude Code, `/mcp` then Authenticate.

**The server does not appear in the client**: each client reads a different file with a slightly different key. VS Code wants `servers`, everyone else wants `mcpServers`, Windsurf wants `serverUrl` for a URL, and Codex wants TOML. Check you edited the right one. The local server writes its diagnostics to stderr, which most clients surface under the server's logs.

**A build "hangs"**: it is not hanging. A building takes 3 to 15 minutes, and `get_project_status` waits up to 50 seconds per call while the agent works. Keep polling until the state leaves `running`.

**`npx` cannot find the package**: you need Node 18 or newer. Check with `node -v`.
