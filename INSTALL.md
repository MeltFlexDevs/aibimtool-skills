# Install

Two things live here, and you can take either or both:

- **Skills**: Markdown that teaches an agent to use AIBIMTool well (what a good brief says, when to ask the user, how to handle the agent's plan, what to do with the IFC).
- **The MCP server**: the tools. Hosted at `https://aibimtool.com/mcp` (OAuth sign-in, every plan), or local through npm as [`aibimtool-mcp`](https://www.npmjs.com/package/aibimtool-mcp) (API key, Starter or Studio).

## Skills

```bash
npx skills add MeltFlexDevs/aibimtool-skills          # any agent
gh skill install MeltFlexDevs/aibimtool-skills        # GitHub CLI 2.90+
```

Claude Code, skills plus the hosted server in one plugin:

```
/plugin marketplace add MeltFlexDevs/aibimtool-skills
/plugin install aibimtool@aibimtool
```

By hand:

```bash
git clone --depth 1 https://github.com/MeltFlexDevs/aibimtool-skills.git
cp -r aibimtool-skills/skills/* ~/.claude/skills/
```

## Hosted MCP server (no key)

| Client | Setup |
| --- | --- |
| Claude (claude.ai, Desktop) | Settings → Connectors → Add custom connector → `https://aibimtool.com/mcp` |
| Claude Code | `claude mcp add --transport http aibimtool https://aibimtool.com/mcp`, then `/mcp` → Authenticate |
| ChatGPT | Settings → Apps & Connectors → Advanced → Developer mode → Create, URL `https://aibimtool.com/mcp`, OAuth |
| Cursor | `~/.cursor/mcp.json`: `{ "mcpServers": { "aibimtool": { "url": "https://aibimtool.com/mcp" } } }` |
| VS Code | `.vscode/mcp.json`: `{ "servers": { "aibimtool": { "type": "http", "url": "https://aibimtool.com/mcp" } } }` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json`: `{ "mcpServers": { "aibimtool": { "serverUrl": "https://aibimtool.com/mcp" } } }` |

## Local MCP server (API key)

Get a key with `npx -y aibimtool-mcp auth login` (browser sign-in, stored in `~/.aibimtool/config.json`) or create one at aibimtool.com → Developers → API keys.

### Claude Code

```bash
claude mcp add aibimtool -- npx -y aibimtool-mcp
```

### Claude Desktop, Cursor, Windsurf, Cline

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

Claude Desktop can also install the extension from `mcpb/` (see the releases for a packed `.mcpb`).

### Codex

`~/.codex/config.toml`:

```toml
[mcp_servers.aibimtool]
command = "npx"
args = ["-y", "aibimtool-mcp"]
env = { AIBIMTOOL_API_KEY = "aibim_sk_..." }
```

### VS Code

```json
{
  "servers": {
    "aibimtool": { "command": "npx", "args": ["-y", "aibimtool-mcp"], "env": { "AIBIMTOOL_API_KEY": "aibim_sk_..." } }
  }
}
```

## Verify

```bash
npx -y aibimtool-mcp whoami
```

prints the account, the plan and the credits. In an MCP client, call `check_credits`.
