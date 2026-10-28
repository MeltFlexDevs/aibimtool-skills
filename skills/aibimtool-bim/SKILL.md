---
name: aibimtool-bim
description: Work with the BIM models AIBIMTool makes. Use when the user wants the IFC file of an AIBIMTool project, wants to open or link it in Revit, ArchiCAD, BlenderBIM, Tekla, Navisworks, Solibri or another IFC tool, wants a plan or a 3D picture of the model, wants to change an existing AIBIMTool model ("make the living room bigger", "add a balcony"), wants to list, stop or clean up their projects, or asks what an AIBIMTool model contains.
---

# AIBIMTool: the model, its IFC and changes to it

Everything after the building exists. If the user needs a new design first, use the `aibimtool-design` skill and come back here with its `project_id`.

## Setup (once)

```bash
claude mcp add --transport http aibimtool https://aibimtool.com/mcp    # hosted: signs in, every plan
npx -y aibimtool-mcp auth login                                         # local server and CLI: Starter or Studio
```

The hosted server returns links; the local one writes files to `./aibimtool-output/` and returns their paths.

## Tools

### `get_ifc_download`
The model as an **IFC4** file. **Free.**

- `project_id` (required).
- `output_path` (local server): a file or a folder; defaults to `./aibimtool-output/`.

The hosted server returns a link valid for seven days that always serves the latest saved model. The model is saved after every step of the agent, so a download while it runs gets the state so far: wait for `ready` before handing it on.

### `get_model_image`
A PNG of the model. **Free.** `view: "iso"` is a 3D view; `view: "plan"` is top-down with every room named and its area. On a building with more than one storey **always pass `storey`** with a plan (`0` is the ground floor, or the storey's name, "Level 2"): without it every storey is drawn over the others and the plan is unreadable. A wrong storey answers with the list of the ones the model has. The first picture can take up to a minute while the BIM engine loads the model.

### `send_message`
A change to the model, on the same `project_id`, then follow it with `get_project_status` as for a new design. **Metered.**

### `list_projects`
The account's projects with their ids, newest first. **Free.**

### `stop_building`
Stops a running agent after the step it is on. **Free**; the steps it took are charged and the model keeps what they built.

## How to work with the user

1. **Ask what the file is for.** Linking into a Revit or ArchiCAD project wants the IFC; a quick look wants `get_model_image` or the viewer link; a client presentation wants both pictures.
2. **Say what an AIBIMTool model is.** Real typed IFC4 elements, not a mesh: IfcWall, IfcSlab, IfcDoor, IfcWindow, IfcStair, IfcRoof, IfcColumn, IfcCurtainWall, IfcRailing and every room as an IfcSpace with its name and area, on named storeys, with materials. It is a design model, not construction documentation; say so before anyone sends it to a contractor.
3. **Look before you report a change.** After a change, `get_model_image` with `view: "plan"` and the storey you changed (or `iso` for the envelope) and check it did what was asked before telling the user it is done.
4. **Make changes concrete**: the element, where, how much. "Widen the first-floor corridor to 1.6 m", "Replace the flat roof with a 30° gable", "Add a lift beside the stair". One change per message keeps them cheap and easy to check.
5. **Reuse the project the user means.** Find it with `list_projects` and ask if two could fit. A new project starts the design over and charges for it again.
6. **Edits made elsewhere stay elsewhere.** Changes in Revit or ArchiCAD do not come back to AIBIMTool; changes in the AIBIMTool workspace (the browser) are part of the model.

## Opening the IFC

| Tool | How |
| --- | --- |
| Revit | Insert, Link IFC to keep it as a reference; File, Open, IFC to convert it to native elements. |
| ArchiCAD | File, Open the .ifc; or File, Interoperability, IFC, Merge into a project. |
| BlenderBIM / Bonsai | File, Open IFC Project. Edits stay native IFC. |
| Tekla, Navisworks, Solibri, BIMcollab | Open or append the .ifc directly. |

## Example

> User: "Take the family house you made, make the living room 2 m deeper, and give me the IFC for Revit."

1. `list_projects` to find it (`9f2c41d07a6b4e15  Family house`).
2. `send_message`: "Make the living room 2 m deeper to the south, keep the other rooms as they are."
3. `get_project_status` until `ready`, then `get_model_image` with `view: "plan"` and `storey: 0` to check the living room grew and nothing else moved.
4. `get_ifc_download`, and tell the user to link it in Revit with Insert, Link IFC.
