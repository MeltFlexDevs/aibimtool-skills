# Contributing

## What lives here

| Path | What it is |
| --- | --- |
| `skills/` | The agent skills. Markdown with YAML frontmatter. |
| `.claude-plugin/` | Claude Code plugin and marketplace manifests. |
| `.mcp.json` | The hosted MCP server, registered by the Claude Code plugin. |
| `mcpb/` | The Claude Desktop extension: a manifest and a self-contained copy of the built server. |
| `server.json` | The MCP registry entry (remote and npm). |
| `setup` | Universal install script. |

The MCP server's TypeScript source is in the AIBIMTool application repository (`aibimtool-mcp/`) and published to npm as `aibimtool-mcp`. `mcpb/server/` holds its compiled output and is regenerated from there, not edited here.

## Editing a skill

A skill is judgement, not a reference manual: the tool schemas already say what the parameters are. Say which choice matters and when: pass the brief in the user's words, show the agent's options with their consequences, never approve a plan the user has not seen.

Keep the frontmatter `description` broad enough that an agent recognises the situation from how a person phrases it ("design me a house", "floor plan", "IFC for Revit").

## Releasing

1. Bump `VERSION`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `mcpb/manifest.json`, `mcpb/server/package.json` and `server.json` together.
2. Refresh `mcpb/server/*.js` from the package's `dist/` if the server changed, and pack the extension: `npx -y @anthropic-ai/mcpb pack mcpb`.
3. Tag the release and attach the `.mcpb`.

## Reporting a problem

Open an issue with the client, the exact config block, and what the server wrote to stderr.
