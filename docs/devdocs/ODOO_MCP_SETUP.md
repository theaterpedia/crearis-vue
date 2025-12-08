# Odoo MCP Setup Guide

## Quick Start

### 1. Install the MCP Server

```bash
# Option A: tuanle96/mcp-odoo (Python/uvx)
pip install mcp-odoo

# Option B: Or use uvx directly (no install needed)
# The .vscode/mcp.json is already configured for uvx
```

### 2. Set Environment Variables

Add to your `.bashrc`, `.zshrc`, or `.env`:

```bash
# Crearis-Odoo Connection
export ODOO_URL="https://odoo.crearis.org"  # or your Odoo URL
export ODOO_DATABASE="crearis"               # your database name
export ODOO_USERNAME="admin@example.com"     # your Odoo username
export ODOO_API_KEY="your-api-key-here"      # Generate in Odoo Settings
```

### 3. Generate Odoo API Key

1. Log into your Odoo instance
2. Go to **Settings** → **Users & Companies** → **Users**
3. Select your user
4. Go to **Account Security** tab
5. Under **API Keys**, click **New API Key**
6. Copy the generated key

### 4. Test the Connection

```bash
# Test with uvx (recommended)
uvx mcp-odoo --help

# Or test with installed package
mcp-odoo --help
```

### 5. Enable in VS Code

1. Open Command Palette (Ctrl+Shift+P)
2. Search for "MCP: Reload Servers"
3. The Odoo server should appear

## MCP Tools Available

Once configured, Claude can use these tools:

| Tool | Description |
|------|-------------|
| `search_records` | Search any Odoo model with domain filters |
| `get_record` | Get a single record by ID |
| `create_record` | Create new record in any model |
| `update_record` | Update existing record |
| `delete_record` | Delete a record |
| `execute_method` | Call any Odoo method |

## Example Queries

```
# Via Claude
"List all mail.activity records for theaterpedia domain"
"Show me the res.partner for hans.opus"
"What fields does the domainuser model have?"
```

## Troubleshooting

### Connection Failed
- Check ODOO_URL includes https://
- Verify API key is valid (not expired)
- Ensure user has API access rights

### Model Not Found
- Some models require specific access rights
- Check if module is installed in Odoo

## Related Files

- `.vscode/mcp.json` - MCP server configuration
- `chat/spec/v0.5-v0.8-integration-planning.md` - Integration strategy
