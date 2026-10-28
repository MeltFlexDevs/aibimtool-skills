# Install AIBIMTool (paste this into your agent)

> Set up the AIBIMTool skills and MCP server for me.
>
> 1. Run `npx -y skills add MeltFlexDevs/aibimtool-skills` to install the skills.
> 2. Register the MCP server with my client. Prefer the hosted server, which signs me in through the browser and needs no key: for Claude Code that is
>    `claude mcp add --transport http aibimtool https://aibimtool.com/mcp`; for any other client, read
>    https://aibimtool.com/mcp and use the block for the one I am on.
> 3. If my client cannot do OAuth, use the local server instead (`npx -y aibimtool-mcp`) and either tell me to run
>    `npx -y aibimtool-mcp auth login` or ask me for my AIBIMTool API key (`aibim_sk_...`) and put it in the `env` block as
>    `AIBIMTOOL_API_KEY`. Do not invent a key.
> 4. Verify by calling `check_credits` (or `npx -y aibimtool-mcp whoami`).
>
> The API, the CLI and the MCP server (hosted or local) are part of the Studio plan. If a key is rejected with a plan error, tell me and stop rather than retrying.

## What gets installed

Two skills, `aibimtool-design` and `aibimtool-bim`, and an MCP server with ten tools: `create_building`, `get_project_status`, `send_message`, `approve_plan`, `continue_building`, `get_model_image`, `get_ifc_download`, `list_projects`, `stop_building` and `check_credits`.

## After it is set up

Try: *"Design a two-storey family house, about 160 m², four bedrooms, open kitchen and living room facing the garden to the south. Then give me the IFC."*
