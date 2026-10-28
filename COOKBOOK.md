# Cookbook

Worked examples: real sequences of tool calls and commands.

## A house from one sentence

> "Design a two-storey family house, 160 m², four bedrooms, garden to the south."

```
[create_building]     brief: "Two-storey family house, 160 m², four bedrooms, garden to the south"
→ 9f2c41d07a6b4e15 · running
[get_project_status]  wait_seconds: 45   (repeat while running)
→ needs_answer: 1. Garage (single / none)  2. Roof (flat / pitched)
[send_message]        "Garage: single. Roof: pitched."
[get_project_status]  → ready · 214 elements · 38 credits
[get_ifc_download]    → IFC link / ./aibimtool-output/two-storey-family-house-….ifc
```

The questions come from the agent's research of the building type. If the user does not care, answer "Take your defaults": the agent then states what it assumed.

## A large brief: plan, approve, build

> "A primary school for 300 pupils: 12 classrooms, gym, canteen, library, two storeys."

The agent proposes a plan of 3-8 tasks (`needs_approval`) before building. Show it to the user with its assumptions line, then:

```
[approve_plan]  project_id: …    → running
```

Long builds run in 8-minute segments and go on by themselves. If one stops at `needs_continue`, call `continue_building`.

## Iterating on a design

```
[send_message] "Move the stair to the north wall and widen the corridor to 1.6 m"
[get_project_status] → ready
[get_model_image] view: plan     (check the change before reporting it)
```

## Brief in, IFC out, in a shell

```bash
npx -y aibimtool-mcp auth login
aibimtool build "Kindergarten for 60 children, one storey, 4 groups, garden to the south" \
  --wait --yes --ifc kindergarten.ifc
```

`--wait` follows the run; `--yes` approves plans; exit code 3 means the agent asked questions: answer with `aibimtool send <id> "…" --wait`.

## Options for a client: three massings

```bash
for brief in "L-shaped" "courtyard" "linear bar"; do
  aibimtool build "Office building, 2,400 m², 4 storeys, $brief plan" --level easy --title "Option: $brief"
done
aibimtool projects
```

`easy` is the cheapest level, right for early massing. Follow each with `aibimtool status <id> --wait`.

## The REST API

```bash
API=https://aibimtool.com/api/v1; H="Authorization: Bearer $AIBIMTOOL_API_KEY"
id=$(curl -sS $API/projects -H "$H" -H "Content-Type: application/json" \
  -d '{"message":"Two-storey family house, 160 m², four bedrooms"}' | jq -r .project.id)
curl -sS "$API/projects/$id?wait=45" -H "$H" | jq .project.state
curl -sS $API/projects/$id/ifc -H "$H" -o house.ifc
```

Reference: <https://aibimtool.com/developers/api>
