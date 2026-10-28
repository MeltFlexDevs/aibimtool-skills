# Cookbook

Worked examples. Everything here is a real sequence of tool calls or CLI commands, not pseudocode.

## A house from one sentence

The one most people want first.

> "Design a two-storey family house, about 110 m², open living room and kitchen behind a curved glass front, two bedrooms."

```
[create_building]
  brief: "Two-storey family house, about 110 m², open living room and kitchen
          behind a curved glass front, two bedrooms"
→ 9f2c41d07a6b4e15 · running

[get_project_status]  wait_seconds: 50     (repeat while running)
→ needs_answer
  1. Roof: Flat (a green roof over the bedrooms) / Pitched (a 30° gable)

[send_message]  "Roof: flat."
[get_project_status]  → ready · 52 elements · 41 credits
```

The questions come from the agent's research of the building type, and each option says what it means for the design. Put them to the user with those consequences. If the user does not care, answer "Take your defaults": the agent then states what it assumed.

Same thing from the shell:

```bash
aibimtool build "Two-storey family house, about 110 m², open living room and kitchen behind a curved glass front, two bedrooms" --wait
# exit code 3: it asked. Answer and follow it again:
aibimtool send 9f2c41d07a6b4e15 "Roof: flat." --wait --ifc house.ifc
```

## A large brief: plan, approve, build

> "A primary school for 300 pupils: 12 classrooms, a gym, a canteen and a library, on two storeys."

A brief this size goes through plan mode. The agent proposes 3 to 8 tasks and waits (`needs_approval`):

```
[get_project_status]
→ needs_approval
  Assumptions: classrooms 60 m² · corridor 2.4 m · gym 15 × 27 m
  #1 [pending] Lay out the ground floor and the gym
  #2 [pending] Raise the upper storey with eight classrooms
  …

[approve_plan]        → running
[get_project_status]  → ready · 1,240 elements
```

Show the plan with its assumptions line before you approve it; changes go in `send_message` ("Make the gym 18 × 30 m") and the agent amends only the affected tasks. Long builds run in 8-minute segments and carry on by themselves. If one ever stops at `needs_continue`, call `continue_building`.

## A room programme, built to its areas

Paste the programme into the brief as text. The agent writes it as the project's program table and builds every row at its target area, then reports target against achieved.

```
[create_building]
  brief: "Health centre. Programme:
          Reception 40 m² · Waiting 60 m² · 6 consulting rooms 16 m² each ·
          2 treatment rooms 20 m² · Staff room 25 m² · WCs 4 × 4 m². One storey."
```

## Changing a model you already have

```
[list_projects]                 → 9f2c41d07a6b4e15  Family house  (52 elements)
[send_message]  "Move the stair to the north wall and widen the corridor to 1.6 m"
[get_project_status]            → ready
[get_model_image]  view: plan, storey: 1   (check the storey you changed)
```

One change per message keeps each run small and easy to check. Always send it to the same `project_id`; a new project would start the design over and charge for it again.

## Options for a client, three massings

```bash
for form in "L-shaped" "courtyard" "linear bar"; do
  aibimtool build "Office building, 2,400 m², 4 storeys, $form plan" \
    --level easy --title "Option: $form" --wait --yes --ifc "option-$form.ifc"
done
aibimtool projects
```

`--level easy` is the cheapest level and right for early massing. Develop the chosen one at `medium` or `high` with `send`.

## Into Revit or ArchiCAD

```
[get_ifc_download]  project_id: 9f2c41d07a6b4e15
→ ./aibimtool-output/family-house-2026-10-28-14-02-11.ifc
```

Revit: Insert, Link IFC to keep it as a reference, or File, Open, IFC to convert it to native elements. ArchiCAD: File, Open, or Interoperability, IFC, Merge into a project. Rooms arrive as IfcSpace with their names and areas, so room schedules work straight away. Edits made there stay there: the agent changes the AIBIMTool model, not your Revit file.

## When a run stops short

| State | What happened | What to do |
| --- | --- | --- |
| `out_of_credits` | The account ran out mid-build; the model keeps what was built | Top up, then `send_message` "Carry on" |
| `failed` | Something failed on our side; it was refunded | Send the same message once more |
| `needs_continue` | A segment reached its time limit and did not chain | `continue_building` |

## Checking the balance before a batch

```bash
aibimtool whoami
```

```
you@example.com
Plan: studio
Credits: 2214
A message is charged for the AI it uses: 1 credit per $0.02, at most 150 per 8-minute segment. Failed runs are refunded.
```

## In CI

With the key in the environment there is no interactive step:

```yaml
- name: Massing study for the new brief
  env:
    AIBIMTOOL_API_KEY: ${{ secrets.AIBIMTOOL_API_KEY }}
  run: |
    npx -y aibimtool-mcp build "$(cat briefs/new-site.txt)" \
      --level easy --wait --yes --ifc artifacts/massing.ifc
    npx -y aibimtool-mcp image "$(npx -y aibimtool-mcp projects --json | jq -r '.[0].id')" \
      --view plan -o artifacts/plan.png
```

Exit codes: `0` done, `2` out of credits or a plan is needed, `3` the agent waits for an answer, `1` everything else. In CI, write the brief so the agent needs nothing from you, or answer `3` with `aibimtool send <id> "Take your defaults" --wait`.
