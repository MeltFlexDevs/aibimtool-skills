---
name: aibimtool-design
description: Design a building with AIBIMTool, an AI architect that turns a brief into a real IFC4 BIM model. Use when the user wants a building designed, massed or laid out (a house, villa, apartment block, office, school, kindergarten, clinic, hotel, warehouse), wants a floor plan or a 3D BIM model from a description or a room programme, wants design options or a feasibility study, or says "design me", "draw up a plan for", "model a building". Covers writing the brief, the agent's questions, its plan, and following the build to a finished model.
---

# AIBIMTool: from a brief to a BIM model

AIBIMTool's agent designs like an architect working in Revit: it researches the building type, asks the few questions only the client can answer, plans large work, then models every wall, slab, door, window, room, stair and roof as IFC4. Once the model exists, use the `aibimtool-bim` skill for the file, pictures and changes.

## Setup (once)

```bash
claude mcp add --transport http aibimtool https://aibimtool.com/mcp    # hosted: signs in, every plan
npx -y aibimtool-mcp auth login                                         # local server and CLI: Starter or Studio
```

In Claude and ChatGPT, add `https://aibimtool.com/mcp` as a custom connector. If a tool reports `plan_required` or `out_of_credits`, say so plainly and point at <https://aibimtool.com/dashboard?view=plans> rather than retrying.

## Tools

### `create_building`
Starts a new design and returns a `project_id` at once; the agent works in the background for 3 to 15 minutes. **Metered**: 1 credit per $0.02 of AI it uses, at most 150 per 8-minute segment, refunded if it fails on our side.

- `brief` (required): the user's brief in their words, completed with what they already told you.
- `title`: a name for the project; otherwise it is named after the brief.
- `level`: `easy` for quick, cheap massing and early options; `medium` (default) for a real layout; `high` (paid plans) for a model someone will build on.

### `get_project_status`
What the project is doing and waiting for. **Free.** Waits up to `wait_seconds` (max 50, default 30) while the agent runs, so call it in a loop until `state` is not `running`. Returns the agent's `reply`, its `questions` with options, its `plan`, the element count, the credits used and the viewer link.

### `send_message`
The next message to the same project: the user's answers to the agent's questions, a change, or a follow-up. **Metered.** Runs in the background like `create_building`.

### `approve_plan`
The go-ahead for the plan the agent proposed for a large brief (`state: needs_approval`). **Metered**: this is where the building gets built.

### `continue_building`
Goes on where a long build stopped at its time limit (`state: needs_continue`). Long builds normally carry on by themselves; this is the fallback.

### `check_credits`
Plan and credits left. Worth calling before a batch of designs.

## How to work with the user

1. **Pass the brief in their words.** Add what they already told you (site, budget, style, the rooms they mentioned). Never invent requirements to make it look complete: the agent researches the building type itself and states its assumptions.
2. **A good brief names five things**: what it is, how big (area or footprint), how many storeys, the rooms that matter, and any relationships ("living room faces the garden to the south"). Missing ones become the agent's questions.
3. **Do not answer for the user.** When the state is `needs_answer`, show every question with its options and their one-line consequences, and pass the answers back with `send_message` ("Garage: single. Roof: pitched."). If the user does not care, send "Take your defaults".
4. **Never approve a plan the user has not seen**, unless they said up front to build without asking. Show the assumptions line and the numbered tasks; changes go in `send_message`.
5. **Tell the user it is working.** A building takes minutes. Say so once, then keep polling `get_project_status` without starting anything new. Never start a second project to "check" on the first: it costs credits again.
6. **Report what was built in two or three sentences**, from the agent's own reply: storeys, main rooms, elements, credits used. Give the viewer link and offer the next step: a picture, the IFC, or a change.
7. **Failures are refunded.** `failed` means nothing was charged for that run; send the same message once more. `out_of_credits` stops everything: name the account and stop.

## Example

> User: "Design me a small villa, about 180 m², two floors, three bedrooms upstairs, a home office downstairs, big windows to the lake on the west."

1. `create_building` with that brief, `level: "medium"`. Tell the user it takes a few minutes.
2. `get_project_status` with `wait_seconds: 50` until it leaves `running`. It comes back `needs_answer`: *Roof: flat / pitched*, *Garage: none / single*.
3. Ask the user, with the options' consequences. They say "flat, no garage". `send_message`: "Roof: flat. Garage: none."
4. Poll again: `ready`, 240 elements, 52 credits. Report the rooms per floor from the agent's reply, link the viewer, and offer the plan picture and the IFC (the `aibimtool-bim` skill).
