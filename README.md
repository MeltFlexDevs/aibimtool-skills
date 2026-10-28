# AIBIMTool Skills

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.1-3b82f6.svg)](./VERSION)
[![Skills](https://img.shields.io/badge/skills-2-8b5cf6.svg)](#skills)
[![npm](https://img.shields.io/badge/npm-aibimtool--mcp-cb3837.svg)](https://www.npmjs.com/package/aibimtool-mcp)
[![Website](https://img.shields.io/badge/aibimtool.com-111111.svg)](https://aibimtool.com)

AI agent skills for **designing buildings as real BIM models** with AIBIMTool. Describe a building; an AI architect researches the type, asks the few questions only you can answer, plans large work, then models every storey, wall, slab, door, window, room, stair and roof as **IFC4**, and changes the model when you ask. Works with Claude, ChatGPT, Claude Code, Cursor, Codex, VS Code, Windsurf and anything else that loads Markdown skills or speaks MCP.

Each user signs in with their **own** AIBIMTool account, and every message is billed to its credits. The skills drive the public [AIBIMTool API](https://aibimtool.com/developers/api) through the MCP server, so there is nothing to build and no BIM kernel to install.

<p align="center">
  <img src="https://aibimtool.com/developers/office-plan-l2.webp" width="46%" alt="Plan of Level 2 of a 7-storey office the agent built: central core, open workplaces, meeting rooms, private offices and focus booths with their areas" />
  <img src="https://aibimtool.com/developers/office-thumb.webp" width="31%" alt="3D view of the same 7-storey office: a rounded glass bar on a glazed plinth, timber fins, sky lounge and roof terrace" />
</p>

<p align="center"><sub>One brief, one IFC4 model of 1,065 elements: the plan of Level 2 with every room measured, and the building itself.</sub></p>

## Install

Pick one. Each method sets the skills up for your agent.

### `npx skills` (recommended, cross-agent)

```bash
npx skills add MeltFlexDevs/aibimtool-skills
```

### GitHub CLI (v2.90+)

```bash
gh skill install MeltFlexDevs/aibimtool-skills
```

### Claude Code marketplace

Inside Claude Code:

```
/plugin marketplace add MeltFlexDevs/aibimtool-skills
/plugin install aibimtool@aibimtool
```

The plugin brings the hosted MCP server with it: run `/mcp` and choose Authenticate once.

### MCP server only

If you want the tools without the skills, add the hosted server. It signs you in with your AIBIMTool account and needs no key:

```bash
claude mcp add --transport http aibimtool https://aibimtool.com/mcp
```

In Claude (claude.ai or Desktop) and ChatGPT, add `https://aibimtool.com/mcp` as a custom connector. For a local server with an API key: `claude mcp add aibimtool -- npx -y aibimtool-mcp`. Configuration for Cursor, Codex, VS Code and Windsurf is in [INSTALL.md](./INSTALL.md) and on the [MCP page](https://aibimtool.com/mcp).

### Setup script

Universal fallback:

```bash
git clone --depth 1 https://github.com/MeltFlexDevs/aibimtool-skills.git
cd aibimtool-skills
./setup
```

More options in [INSTALL.md](./INSTALL.md). Agent-driven install, to paste into your agent: [INSTALL_FOR_AGENTS.md](./INSTALL_FOR_AGENTS.md).

## Authenticate

The hosted server at `https://aibimtool.com/mcp` needs nothing here: your client opens the AIBIMTool sign-in, and it works on every plan.

The local server and the CLI use an API key, part of the **Starter** and **Studio** plans. The simplest way to get one is the browser flow, which mints a key from your session and hands it back over loopback so you never copy or paste a secret:

```bash
npx -y aibimtool-mcp auth login
```

Or create one by hand at **[aibimtool.com](https://aibimtool.com/dashboard/developers/api-keys) → Developers → API keys** and export it:

```bash
export AIBIMTOOL_API_KEY="aibim_sk_..."
```

The key is shown exactly once at creation. Only its SHA-256 is stored, so nobody can recover it afterwards, including us. An account may hold five live keys and revoking one takes effect on the next request.

## Skills

| Skill | Invoke | What it covers |
| --- | --- | --- |
| [`aibimtool-design`](./skills/aibimtool-design/SKILL.md) | `/aibimtool:design` | A brief to a BIM model: writing a brief the agent builds well, its questions, approving its plan, following the build, levels and costs. |
| [`aibimtool-bim`](./skills/aibimtool-bim/SKILL.md) | `/aibimtool:bim` | Everything after the model exists: the IFC file, opening it in Revit, ArchiCAD, BlenderBIM or Tekla, pictures to check it by, and changes. |

## Tools

| Tool | What it does | Cost |
| --- | --- | --- |
| `create_building` | Start a new design from a brief; returns a project id at once | Metered |
| `get_project_status` | State, the agent's reply, its questions or plan; waits while it runs | Free |
| `send_message` | Answers, changes and follow-ups to a project's agent | Metered |
| `approve_plan` | The go-ahead for the agent's plan | Metered |
| `continue_building` | Go on after a run stopped at its time limit | Metered |
| `get_model_image` | A 3D view, or the plan of one storey with every room named and measured | Free |
| `get_ifc_download` | The IFC4 model: a file on disk (local) or a link (hosted) | Free |
| `list_projects` | The account's projects | Free |
| `stop_building` | Stop the running agent after its current step | Free |
| `check_credits` | Plan and credits left | Free |

**Metered** means a message is charged for the AI it uses: 1 credit per $0.02, at most 150 credits per 8-minute segment. A run that fails on our side is refunded automatically, so an agent that retries does not quietly drain the balance.

A building takes minutes, longer than a chat holds a tool call open, so `create_building` returns at once and `get_project_status` waits up to 50 seconds per call while the agent works. The local server writes IFC files and pictures to disk (`./aibimtool-output/` unless you pass `output_path`) and returns the path rather than the bytes: an IFC is megabytes, and the agent usually just hands it to the next step.

## What it looks like in practice

> **You:** Design a 7-story office building with a ground-floor lobby, café, and event space. Floors 2 through 4 are typical office floors around a central core with stairs, elevators, and restrooms. Add a rooftop terrace.

```
[create_building]     brief: "Design a 7-story office building with a ground-floor lobby, …"
→ project 019cf06362ab4dac · running

[get_project_status]  wait_seconds: 50
→ needs_answer
  1. Floors 5-7: Same typical office floors / Offices plus a top-floor amenity / Larger-tenant floors
  2. Floor plate: About 800 m² / About 1,200 m² / About 1,800 m²
  3. Massing: Rounded bar on a glazed plinth / Two offset volumes with a cantilever / Stepped terraces

> You: Offices plus a top-floor amenity, about 800 m², rounded bar on a glazed plinth.

[send_message]        → needs_approval: a five-task plan
> You: Go ahead.
[approve_plan]        → running
[get_project_status]  → ready · 1,065 elements

[get_model_image]     view: plan · storey: 1
→ ./aibimtool-output/019cf06362ab4dac-plan-storey-1-2026-10-28-14-02-09.png
[get_ifc_download]
→ ./aibimtool-output/design-a-7-story-office-building-with-a-2026-10-28-14-02-11.ifc
```

That is a real run: the questions, the plan and the 1,065 elements are what the agent produced for that brief. The IFC opens in Revit, ArchiCAD, BlenderBIM, Tekla and Navisworks; the project also opens in the AIBIMTool 3D viewer to keep changing it. More patterns in [COOKBOOK.md](./COOKBOOK.md).

## A good brief changes everything

The agent builds what the brief says and researches the rest, stating its assumptions. A brief that names the building type, its size, the number of storeys and the rooms that matter gets a design on the first run; a vague one gets questions first. Pass the user's words, add what they already told you, and never invent requirements to make it look complete. It is the single biggest quality lever in the whole workflow.

## The CLI

The same package is a command-line tool when you run it with arguments instead of letting an agent speak MCP to it:

```bash
aibimtool build "Kindergarten for 60 children, one storey, 4 groups" --wait --yes --ifc kindergarten.ifc
aibimtool send 019cf06362ab4dac "Make the event space open to the terrace" --wait
aibimtool image 019cf06362ab4dac --storey 1 -o level-2.png
```

Full reference at [aibimtool.com/developers/cli](https://aibimtool.com/developers/cli).

## Documentation

- [API reference](https://aibimtool.com/developers/api): every endpoint, request and response
- [CLI](https://aibimtool.com/developers/cli): every command and flag
- [MCP](https://aibimtool.com/mcp): client-by-client setup
- [COOKBOOK.md](./COOKBOOK.md): worked examples
- [CONTRIBUTING.md](./CONTRIBUTING.md)

## Licence

MIT. See [LICENSE](./LICENSE).
