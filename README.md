# AIBIMTool Skills

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-3b82f6.svg)](./VERSION)
[![Skills](https://img.shields.io/badge/skills-2-8b5cf6.svg)](#skills)
[![npm](https://img.shields.io/badge/npm-aibimtool--mcp-cb3837.svg)](https://www.npmjs.com/package/aibimtool-mcp)
[![Website](https://img.shields.io/badge/aibimtool.com-111111.svg)](https://aibimtool.com)

AI agent skills and an MCP server for **designing buildings as real BIM models** with [AIBIMTool](https://aibimtool.com). Describe a building; an AI architect researches the type, asks the few questions only you can answer, plans large work, then models every storey, wall, slab, door, window, room, stair and roof as **IFC4**, and changes the model when you ask. Works with Claude, ChatGPT, Claude Code, Cursor, Codex, VS Code, Windsurf and anything else that speaks MCP or loads Markdown skills.

Every user signs in with their **own** AIBIMTool account, and every message is billed to its credits.

## Connect in one line

The hosted MCP server needs no key and works on every plan. Add this URL as a connector and sign in:

```
https://aibimtool.com/mcp
```

- **Claude** (claude.ai or Desktop): Settings → Connectors → Add custom connector.
- **Claude Code**: `claude mcp add --transport http aibimtool https://aibimtool.com/mcp`, then `/mcp` → Authenticate.
- **ChatGPT**: Settings → Apps & Connectors → Advanced → Developer mode → Create.
- **Cursor, VS Code, Windsurf**: see [INSTALL.md](./INSTALL.md).

## Install the skills

### `npx skills` (recommended, cross-agent)

```bash
npx skills add MeltFlexDevs/aibimtool-skills
```

### GitHub CLI (v2.90+)

```bash
gh skill install MeltFlexDevs/aibimtool-skills
```

### Claude Code plugin (skills and the MCP server together)

```
/plugin marketplace add MeltFlexDevs/aibimtool-skills
/plugin install aibimtool@aibimtool
```

### Local MCP server (API key)

For agents with a filesystem: the same tools, with IFC files and pictures written to `./aibimtool-output/`.

```bash
claude mcp add aibimtool -- npx -y aibimtool-mcp
```

It signs in through the browser on first use (Starter or Studio plan), or reads `AIBIMTOOL_API_KEY`. More in [INSTALL.md](./INSTALL.md); for an agent to install it for you, paste [INSTALL_FOR_AGENTS.md](./INSTALL_FOR_AGENTS.md).

## Skills

| Skill | Invoke | What it covers |
| --- | --- | --- |
| [`aibimtool-design`](./skills/aibimtool-design/SKILL.md) | `/aibimtool:design` | A brief to a BIM model: writing the brief, the agent's questions, approving its plan, following the build, levels and costs. |
| [`aibimtool-bim`](./skills/aibimtool-bim/SKILL.md) | `/aibimtool:bim` | After the model exists: the IFC file, opening it in Revit, ArchiCAD, BlenderBIM or Tekla, pictures, and changes. |

## Tools

| Tool | What it does | Credits |
| --- | --- | --- |
| `create_building` | Start a new design from a brief; returns a project id at once | Metered |
| `get_project_status` | State, the agent's reply, its questions or plan; waits while it runs | Free |
| `send_message` | Answers, changes and follow-ups to a project's agent | Metered |
| `approve_plan` | The go-ahead for the agent's plan | Metered |
| `continue_building` | Go on after a run stopped at its time limit | Metered |
| `get_model_image` | A 3D or plan picture of the model | Free |
| `get_ifc_download` | The IFC4 model: a link (hosted) or a file on disk (local) | Free |
| `list_projects` | The account's projects | Free |
| `stop_building` | Stop the running agent | Free |
| `check_credits` | Plan and credits left | Free |

**Metered** means a message is charged for the AI it uses: 1 credit per $0.02, at most 150 credits per 8-minute segment. A run that fails on our side is refunded automatically.

## What it looks like

> **You:** Design a two-storey family house, 160 m², four bedrooms, garden to the south.

```
[create_building]     → project 9f2c41d07a6b4e15, running
[get_project_status]  → needs_answer
                        1. Garage: single garage / no garage
                        2. Roof: flat / pitched
> You: Single garage, pitched roof.
[send_message]        → running
[get_project_status]  → ready · 214 elements · 38 credits
[get_model_image]     → (the 3D view)
[get_ifc_download]    → https://aibimtool.com/api/mcp/ifc?t=…
```

The IFC opens in Revit, ArchiCAD, BlenderBIM, Tekla, Navisworks and Solibri; the project also opens in the AIBIMTool 3D viewer.

## Also

- REST API and CLI: <https://aibimtool.com/developers>
- MCP docs: <https://aibimtool.com/mcp>
- Worked examples: [COOKBOOK.md](./COOKBOOK.md)

## License

MIT
