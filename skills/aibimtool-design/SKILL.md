---
name: aibimtool-design
description: Design a building with AIBIMTool, an AI architect that turns a brief into a real IFC4 BIM model. Use when the user wants a building designed, massed or laid out (a house, villa, apartment block, office, school, kindergarten, clinic, hotel, warehouse), wants a floor plan or a 3D BIM model from a description or a room programme, or wants feasibility options for a plot. Covers writing the brief, the agent's questions, its plan, and following the build.
---

# AIBIMTool: from a brief to a BIM model

AIBIMTool's agent designs like an architect working in Revit: it researches the building type, asks the few questions only the client can answer, plans large work, then models every wall, slab, door, window, room, stair and roof as IFC4. You drive it with the AIBIMTool tools (MCP) or the `aibimtool` CLI; the user's own account pays.

## Setup (once)

- **Claude, ChatGPT, Cursor, VS Code**: add the hosted MCP server `https://aibimtool.com/mcp` and sign in. No key, every plan.
- **Local agent or CLI**: `npx -y aibimtool-mcp auth login` (Starter or Studio plan), or set `AIBIMTOOL_API_KEY`.

If a tool reports `plan_required` or `out_of_credits`, tell the user plainly and point at <https://aibimtool.com/dashboard?view=plans>. Do not retry.

## Write a brief the agent builds well

Pass the user's brief **in their words**, completed with what they already told you. A good brief says:

1. **What it is**: building type and use ("two-storey family house", "kindergarten for 60 children in 4 groups").
2. **How big**: gross floor area, footprint or plot size, number of storeys.
3. **The rooms that matter**: counts and sizes ("4 bedrooms, one on the ground floor; open kitchen-living 45 m²").
4. **Relationships**: "living room faces the garden to the south", "staff entrance separate from the parents' one".
5. **Form and material**, if they care: flat or pitched roof, brick, timber, glazing.

Do not invent requirements to make the brief look complete: the agent researches the building type itself and states its assumptions. Do not ask the user about things the agent decides (storey heights, wall thickness, structure, setbacks).

A room programme (a table of spaces with areas) can go in the brief as text; the agent writes it as the project's program and builds against it.

## The run

`create_building` returns at once with a `project_id`. A building takes **3 to 15 minutes**: tell the user it is working, then call `get_project_status` (it waits up to 50 s per call) until `state` is no longer `running`. Do not start a second project to "check": it costs credits again.

| state | what you do |
| --- | --- |
| `needs_answer` | Show the agent's questions **with their options and the one-line consequences**, let the user choose, and pass the answers with `send_message` (e.g. "Garage: single garage. Roof: pitched."). If the user does not care, say "Take your defaults". |
| `needs_approval` | Large briefs get a plan of 3-8 tasks. Show it, with the assumptions line. `approve_plan` only after the user agrees, or if they said up front to build without asking. Changes to the plan go in `send_message`. |
| `needs_continue` | A long build stopped at its time limit and did not go on by itself: `continue_building`. |
| `ready` | Report what was built in a sentence or two (the agent's reply has the facts), give the viewer link, and offer the next step: a picture (`get_model_image`), the IFC (`get_ifc_download`), or a change. |
| `out_of_credits` | Say so and name the account. Stop. |
| `failed` | It was refunded. Retry the same message once; if it fails again, tell the user. |

## Changes

Every change goes to **the same project** with `send_message`: "Move the stair to the north wall", "Add a 2 m deep balcony to the master bedroom", "Make the ground floor 3.2 m high". Be specific about what, where and how much; the agent keeps what it is not told to change.

## Levels

`level`: `easy` is quickest and cheapest, for massing and early options; `medium` (default) for a real layout; `high` (paid plans) checks its work most thoroughly, for a model someone will build on.

## Costs

Metered by the AI each message uses: 1 credit per $0.02, at most 150 credits per 8-minute segment. A house is typically tens of credits, a large planned building more. Failures are refunded automatically. `check_credits` shows the balance; worth calling before a batch.

## Example

> User: "Design me a small villa, about 180 m², two floors, three bedrooms upstairs, a home office downstairs, big windows to the lake on the west."

1. `create_building` with that brief, `level: "medium"`.
2. `get_project_status` until it leaves `running`. It comes back `needs_answer`: *Roof: flat / pitched*, *Garage: none / single*.
3. Ask the user; they say "flat, no garage". `send_message`: "Roof: flat. Garage: none."
4. Poll again; `ready`, 240 elements. Tell the user what was built, link the viewer, offer the IFC.
