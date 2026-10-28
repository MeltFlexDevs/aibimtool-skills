# Notes for agents working in this repository

This repository distributes the AIBIMTool skills and the packaging around them. It is not the MCP server's source; that lives in the AIBIMTool application repository (`aibimtool-mcp/`) and ships to npm as `aibimtool-mcp`.

## Rules

- **Version numbers move together**: `VERSION`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `mcpb/manifest.json`, `mcpb/server/package.json`, `server.json`.
- **Do not edit `mcpb/server/*.js` by hand.** It is build output copied from the package's `dist/`.
- **Pricing is metered and enforced server-side** (1 credit per $0.02 of AI, at most 150 per 8-minute segment). If it changes in the app, update the README, both skills, `llms-install.md` and `mcpb/manifest.json`.
- **The skills carry judgement, not schemas.** Do not turn a SKILL.md into a parameter list; that is what the tool definitions and <https://aibimtool.com/developers> are for.
