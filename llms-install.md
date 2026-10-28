# Installing the AIBIMTool MCP server (for Cline and other agents)

AIBIMTool is available two ways:

1. **Hosted (recommended)**: a remote Streamable HTTP server at `https://aibimtool.com/mcp`. The client signs the user in with OAuth; no key.
2. **Local (stdio)**: the npm package `aibimtool-mcp`, run through `npx`. Needs Node.js 18+ and an AIBIMTool API key (`aibim_sk_...`) on a Starter or Studio plan. Ask the user for their key or have them run `npx -y aibimtool-mcp auth login`. Do not invent one.

## Local install (Cline: `cline_mcp_settings.json`)

```json
{
  "mcpServers": {
    "aibimtool": {
      "command": "npx",
      "args": ["-y", "aibimtool-mcp"],
      "env": { "AIBIMTOOL_API_KEY": "USER_PROVIDED_KEY" },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Verify

Call `check_credits`. It returns the plan and the credits. A missing-key error means the `env` block did not reach the server; a plan error means the account needs Starter or Studio, and retrying will not help.

## Tools

`create_building`, `get_project_status`, `send_message`, `approve_plan` and `continue_building` start or follow the AI architect (metered credits, failures refunded); `get_model_image`, `get_ifc_download`, `list_projects`, `stop_building` and `check_credits` are free. Files are written to `./aibimtool-output/` (or `output_path`).

Full documentation: <https://aibimtool.com/mcp>
