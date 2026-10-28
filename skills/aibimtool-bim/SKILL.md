---
name: aibimtool-bim
description: Work with the BIM models AIBIMTool makes. Use when the user wants the IFC file of an AIBIMTool project, wants to open it in Revit, ArchiCAD, BlenderBIM, Tekla, Navisworks, Solibri or another IFC viewer, wants a plan or 3D picture of the model, wants to change an existing AIBIMTool model, list or clean up their projects, or asks what an AIBIMTool model contains.
---

# AIBIMTool: the model, its IFC and changes to it

Everything after the building exists. To design a new one, use the `aibimtool-design` skill.

## What a model is

An **IFC4** file built with IfcOpenShell: a site, a building, storeys, and real typed elements (IfcWall, IfcSlab, IfcDoor, IfcWindow, IfcSpace for each room with its name and area, IfcStair, IfcRoof, IfcColumn, IfcCurtainWall, IfcRailing, IfcCovering, with materials). Rooms carry their names and areas, so schedules and area take-offs work in any BIM tool. It is a design model, not construction documentation: say so if the user is about to send it to a contractor as-is.

## Getting the file

- Hosted MCP (Claude, ChatGPT): `get_ifc_download` returns a link valid for 7 days that always serves the latest saved model.
- Local MCP: `get_ifc_download` writes `./aibimtool-output/<title>-<time>.ifc` (or `output_path`) and returns the path.
- CLI: `aibimtool ifc <id> -o house.ifc`. API: `GET /api/v1/projects/:id/ifc`.

The model is saved after every step of the agent, so a download during a run gets the state so far. Wait for `ready` before handing it on.

## Opening it

| Tool | How |
| --- | --- |
| Revit | Insert → Link IFC (to keep it as a reference) or File → Open → IFC (to convert to native elements). |
| ArchiCAD | File → Open → select the .ifc; or File → Interoperability → IFC → Merge into a project. |
| BlenderBIM / Bonsai | File → Open IFC Project. Edits stay native IFC. |
| Tekla, Navisworks, Solibri, BIMcollab | Open or append the .ifc directly. |
| Quick look | The AIBIMTool viewer link in every status (`viewerUrl`), signed in as the same account. |

## Looking at it

`get_model_image` with `view: "iso"` (3D) or `"plan"` (top-down, rooms named with areas). Free. The first one can take up to a minute while the BIM engine loads the model. Use it to check a change before telling the user it is done, and to show the user without making them open the viewer.

## Changing it

`send_message` on the same `project_id`, then follow the status as for a new design. Be concrete: element, place, amount. "Widen the corridor on the first floor to 1.6 m", "Replace the flat roof with a 30° gable roof", "Add a lift next to the stair". One change per message keeps them cheap and easy to check; several small related ones can go together.

The agent cannot read edits made to the IFC in another tool: changes made in Revit stay in Revit. Changes made in the AIBIMTool workspace (the browser) are part of the model.

## Projects

`list_projects` lists them, newest first. Reuse the project the user means rather than starting a new one; ask if it is ambiguous. `stop_building` stops a run after its current step (the steps taken are charged).
