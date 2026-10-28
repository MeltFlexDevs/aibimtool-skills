# Installing the AIBIMTool MCP server (for Cline and other agents)

AIBIMTool is a **local (stdio)** MCP server distributed on npm as `aibimtool-mcp`. No build or clone is required, because it runs through `npx`. (If the client supports remote servers with OAuth, `https://aibimtool.com/mcp` needs no key at all.)

## Prerequisites

- **Node.js 18+** (for `npx`).
- An **AIBIMTool API key** (`aibim_sk_...`), which requires an active **Starter** or **Studio** plan. Create one at <https://aibimtool.com/dashboard/developers/api-keys>, or have the user run `npx -y aibimtool-mcp auth login`. Ask the user for their key. Do not invent one.

## Install (add to the MCP settings)

Add this entry to the Cline MCP settings file (`cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "aibimtool": {
      "command": "npx",
      "args": ["-y", "aibimtool-mcp"],
      "env": {
        "AIBIMTOOL_API_KEY": "USER_PROVIDED_KEY"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Replace `USER_PROVIDED_KEY` with the user's `aibim_sk_...` key.

## Verify

Call the `check_credits` tool. It returns the account's plan and credits. If it reports a missing key, the `env` block did not reach the server. If it reports that the API needs a Starter or Studio plan, the account has no plan and no amount of retrying will help.

## Tools

| Tool | Cost |
| --- | --- |
| `create_building` | metered |
| `get_project_status` | free |
| `send_message` | metered |
| `approve_plan` | metered |
| `continue_building` | metered |
| `get_model_image` | free |
| `get_ifc_download` | free |
| `list_projects` | free |
| `stop_building` | free |
| `check_credits` | free |

Metered: 1 credit per $0.02 of AI a message uses, at most 150 per 8-minute segment; failed runs are refunded automatically. A building takes 3 to 15 minutes: `create_building` returns a project id at once, then poll `get_project_status` until the state leaves `running`. Files are written to `./aibimtool-output/` (or `output_path`) and returned as paths.

Full documentation: <https://aibimtool.com/mcp>
