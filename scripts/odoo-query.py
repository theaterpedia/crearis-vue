#!/usr/bin/env python3
"""
Odoo Query Utility for Crearis-Vue Development

Direct XML-RPC access to Crearis-Odoo for:
- Schema exploration (fields, models)
- Data queries (partners, activities, etc.)
- Test data verification
- Sync development

Usage:
    python scripts/odoo-query.py models              # List all models
    python scripts/odoo-query.py fields res.partner  # Show model fields
    python scripts/odoo-query.py search res.partner  # Search records
    python scripts/odoo-query.py read res.partner 1  # Read single record
    python scripts/odoo-query.py count res.partner   # Count records
    python scripts/odoo-query.py exec res.partner method_name  # Execute method

Environment variables (or edit DEFAULTS below):
    ODOO_URL, ODOO_DATABASE, ODOO_USERNAME, ODOO_API_KEY

December 2025 - v0.5 preparation
"""

import xmlrpc.client
import json
import sys
import os
from typing import Any, Optional
from pprint import pprint

# ============================================================================
# CONFIGURATION
# ============================================================================

DEFAULTS = {
    'url': 'http://localhost:8069',
    'database': 'crearis',
    'username': 'admin',
    'api_key': '306861a0b7a9d3838f4bb074f9d34179d0021833'
}

def get_config():
    """Get configuration from environment or defaults."""
    return {
        'url': os.environ.get('ODOO_URL', DEFAULTS['url']),
        'database': os.environ.get('ODOO_DATABASE', DEFAULTS['database']),
        'username': os.environ.get('ODOO_USERNAME', DEFAULTS['username']),
        'api_key': os.environ.get('ODOO_API_KEY', DEFAULTS['api_key'])
    }

# ============================================================================
# ODOO CONNECTION
# ============================================================================

class OdooClient:
    """Simple Odoo XML-RPC client."""
    
    def __init__(self):
        config = get_config()
        self.url = config['url']
        self.db = config['database']
        self.username = config['username']
        self.api_key = config['api_key']
        self.uid = None
        self._common = None
        self._models = None
    
    @property
    def common(self):
        if not self._common:
            self._common = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/common')
        return self._common
    
    @property
    def models(self):
        if not self._models:
            self._models = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/object')
        return self._models
    
    def connect(self) -> bool:
        """Authenticate and return True if successful."""
        try:
            self.uid = self.common.authenticate(
                self.db, self.username, self.api_key, {}
            )
            return bool(self.uid)
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def version(self) -> dict:
        """Get Odoo server version."""
        return self.common.version()
    
    def execute(self, model: str, method: str, *args, **kwargs) -> Any:
        """Execute a method on a model."""
        if not self.uid:
            self.connect()
        return self.models.execute_kw(
            self.db, self.uid, self.api_key,
            model, method, list(args), kwargs
        )
    
    # Convenience methods
    def search(self, model: str, domain: list = None, **kwargs) -> list:
        """Search for record IDs."""
        return self.execute(model, 'search', domain or [], **kwargs)
    
    def read(self, model: str, ids: list, fields: list = None) -> list:
        """Read records by IDs."""
        args = [ids]
        if fields:
            args.append(fields)
        return self.execute(model, 'read', *args)
    
    def search_read(self, model: str, domain: list = None, 
                    fields: list = None, **kwargs) -> list:
        """Search and read in one call."""
        return self.execute(model, 'search_read', domain or [], fields or [], **kwargs)
    
    def count(self, model: str, domain: list = None) -> int:
        """Count records matching domain."""
        return self.execute(model, 'search_count', domain or [])
    
    def fields_get(self, model: str, attributes: list = None) -> dict:
        """Get field definitions for a model."""
        attrs = attributes or ['string', 'type', 'required', 'readonly', 'relation']
        return self.execute(model, 'fields_get', [], {'attributes': attrs})
    
    def get_models(self) -> list:
        """Get list of all available models."""
        models = self.search_read('ir.model', [], ['model', 'name'], order='model')
        return models

# ============================================================================
# CLI COMMANDS
# ============================================================================

def cmd_version(client: OdooClient, args: list):
    """Show Odoo version and connection info."""
    print(f"Connecting to: {client.url}")
    print(f"Database: {client.db}")
    
    version = client.version()
    print(f"\n✅ Odoo {version['server_version']}")
    print(f"   Protocol: {version['protocol_version']}")
    
    if client.connect():
        print(f"   Authenticated as UID: {client.uid}")

def cmd_models(client: OdooClient, args: list):
    """List all models, optionally filtered."""
    filter_str = args[0].lower() if args else ''
    
    if not client.connect():
        return
    
    models = client.get_models()
    
    if filter_str:
        models = [m for m in models if filter_str in m['model'].lower() or filter_str in m['name'].lower()]
    
    print(f"\n{'Model':<40} {'Name'}")
    print("=" * 80)
    for m in models[:50]:  # Limit output
        print(f"{m['model']:<40} {m['name']}")
    
    if len(models) > 50:
        print(f"\n... and {len(models) - 50} more (use filter to narrow)")
    print(f"\nTotal: {len(models)} models")

def cmd_fields(client: OdooClient, args: list):
    """Show fields for a model."""
    if not args:
        print("Usage: fields <model>")
        print("Example: fields res.partner")
        return
    
    model = args[0]
    filter_str = args[1].lower() if len(args) > 1 else ''
    
    if not client.connect():
        return
    
    fields = client.fields_get(model)
    
    if filter_str:
        fields = {k: v for k, v in fields.items() if filter_str in k.lower()}
    
    print(f"\nFields for {model}:")
    print("=" * 80)
    
    for name, info in sorted(fields.items()):
        ftype = info.get('type', '?')
        label = info.get('string', '')
        required = '(req)' if info.get('required') else ''
        relation = f" → {info['relation']}" if info.get('relation') else ''
        
        print(f"  {name:<30} {ftype:<12} {label} {required}{relation}")
    
    print(f"\nTotal: {len(fields)} fields")

def cmd_search(client: OdooClient, args: list):
    """Search records in a model."""
    if not args:
        print("Usage: search <model> [domain] [fields] [limit]")
        print("Example: search res.partner")
        print("Example: search res.partner \"[('email', '!=', False)]\" \"name,email\" 10")
        return
    
    model = args[0]
    domain = eval(args[1]) if len(args) > 1 else []
    fields = args[2].split(',') if len(args) > 2 else ['id', 'name', 'display_name']
    limit = int(args[3]) if len(args) > 3 else 10
    
    if not client.connect():
        return
    
    records = client.search_read(model, domain, fields, limit=limit)
    
    print(f"\nResults from {model} (limit {limit}):")
    print("=" * 80)
    
    for rec in records:
        print(json.dumps(rec, indent=2, default=str))
    
    total = client.count(model, domain)
    print(f"\nShowing {len(records)} of {total} total records")

def cmd_read(client: OdooClient, args: list):
    """Read specific record(s) by ID."""
    if len(args) < 2:
        print("Usage: read <model> <id> [fields]")
        print("Example: read res.partner 1")
        print("Example: read res.partner 1,2,3 name,email")
        return
    
    model = args[0]
    ids = [int(i) for i in args[1].split(',')]
    fields = args[2].split(',') if len(args) > 2 else None
    
    if not client.connect():
        return
    
    records = client.read(model, ids, fields)
    
    for rec in records:
        print(json.dumps(rec, indent=2, default=str))

def cmd_count(client: OdooClient, args: list):
    """Count records in a model."""
    if not args:
        print("Usage: count <model> [domain]")
        return
    
    model = args[0]
    domain = eval(args[1]) if len(args) > 1 else []
    
    if not client.connect():
        return
    
    count = client.count(model, domain)
    print(f"\n{model}: {count} records")

def cmd_exec(client: OdooClient, args: list):
    """Execute a model method."""
    if len(args) < 2:
        print("Usage: exec <model> <method> [args_json]")
        print("Example: exec res.partner name_search \"['admin']\"")
        return
    
    model = args[0]
    method = args[1]
    method_args = eval(args[2]) if len(args) > 2 else []
    
    if not client.connect():
        return
    
    if not isinstance(method_args, list):
        method_args = [method_args]
    
    result = client.execute(model, method, *method_args)
    pprint(result)

def cmd_help(client: OdooClient, args: list):
    """Show help."""
    print(__doc__)
    print("\nCommands:")
    print("  version              - Show Odoo version and test connection")
    print("  models [filter]      - List models (optionally filtered)")
    print("  fields <model>       - Show fields for a model")
    print("  search <model> ...   - Search records")
    print("  read <model> <id>    - Read record by ID")
    print("  count <model>        - Count records")
    print("  exec <model> <method>- Execute model method")
    print("  help                 - Show this help")

# ============================================================================
# MAIN
# ============================================================================

COMMANDS = {
    'version': cmd_version,
    'models': cmd_models,
    'fields': cmd_fields,
    'search': cmd_search,
    'read': cmd_read,
    'count': cmd_count,
    'exec': cmd_exec,
    'help': cmd_help,
}

def main():
    if len(sys.argv) < 2:
        cmd_help(None, [])
        return
    
    command = sys.argv[1].lower()
    args = sys.argv[2:]
    
    if command not in COMMANDS:
        print(f"Unknown command: {command}")
        print(f"Available: {', '.join(COMMANDS.keys())}")
        return
    
    client = OdooClient()
    COMMANDS[command](client, args)

if __name__ == '__main__':
    main()
