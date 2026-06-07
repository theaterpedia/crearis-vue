# Domain Management

The Domain Management view (`/admin/domains`) allows administrators to configure custom domains and subdomains for projects.

## Overview

Theaterpedia supports two types of domain configurations:

| Type | Example | SSL | Setup |
|------|---------|-----|-------|
| **Subdomain** | `dasei.theaterpedia.org` | Wildcard cert | Instant |
| **Custom Domain** | `dasei.eu` | Individual cert | Guided |

## Architecture

The system uses nginx's `map` directive for efficient domain routing:

```nginx
map $host $domaincode {
    default "";
    dasei.theaterpedia.org   "dasei";
    dasei.eu                 "dasei";
}
```

This approach:
- Scales to 100+ domains with O(1) lookup
- Single server block handles all domains
- Easy to automate via scripts

## Admin UI

### Domain List

The main view shows all configured domains with:
- Domain name
- Type (subdomain/custom)
- Linked project
- Actions (edit/delete)

### System Domains

Shows available parent domains for subdomains:
- `*.theaterpedia.org` (wildcard SSL available)
- `*.crearis.info` (private)

## Adding Domains

### Subdomains (Instant)

1. Click **+ Add Domain**
2. Select **Subdomain** type
3. Choose system domain (e.g., `theaterpedia.org`)
4. Enter subdomain name (e.g., `dasei`)
5. Select target project
6. Click **Create Subdomain**

The subdomain is immediately active - no server access needed.

### Custom Domains (Guided)

1. Click **+ Add Domain**
2. Select **Custom Domain** type
3. Enter domain and TLD (e.g., `dasei` + `eu`)
4. Select target project
5. Click **Generate Setup Instructions**

#### Step 1: Configure DNS

Add these records at your domain registrar:

| Type | Name | Value |
|------|------|-------|
| A | @ | `YOUR_SERVER_IP` |
| A | www | `YOUR_SERVER_IP` |

Use **Check DNS** to verify propagation (may take 5-60 minutes).

#### Step 2: Run Server Script

SSH into the server and run:

```bash
sudo /opt/crearis/scripts/add-domain.sh dasei.eu dasei
```

This script:
1. Obtains SSL certificate via certbot
2. Adds domain to nginx map
3. Reloads nginx

#### Step 3: Confirm Setup

Click **Domain Setup Complete** to register the domain in the database.

## Editing Domains

Click the edit button (✏️) to:
- Change the linked project
- Update the description

::: warning
Domain names cannot be changed after creation. Delete and recreate if needed.
:::

## Removing Domains

1. Click the delete button (🗑️)
2. Confirm deletion

::: danger
This only removes the database entry. To fully remove a custom domain:

```bash
# Remove from nginx map
sudo /opt/crearis/scripts/remove-domain.sh dasei.eu

# Optionally revoke SSL certificate
sudo certbot delete --cert-name dasei.eu
```
:::

## Server Scripts

Located in `/opt/crearis/scripts/` (symlinked from repo):

| Script | Purpose |
|--------|---------|
| `add-domain.sh` | Add custom domain with SSL |
| `add-subdomain.sh` | Add subdomain to nginx map |
| `remove-domain.sh` | Remove domain from nginx map |

### add-domain.sh

```bash
sudo ./add-domain.sh <domain> <domaincode>
# Example: sudo ./add-domain.sh dasei.eu dasei
```

### add-subdomain.sh

```bash
sudo ./add-subdomain.sh <subdomain> <sysdomain> <domaincode>
# Example: sudo ./add-subdomain.sh dasei theaterpedia.org dasei
```

### remove-domain.sh

```bash
sudo ./remove-domain.sh <domain>
# Example: sudo ./remove-domain.sh dasei.eu
```

## Nginx Configuration

### Map File

Location: `/etc/nginx/conf.d/domain-map.conf`

```nginx
map $host $domaincode {
    default "";
    
    # Subdomains
    dasei.theaterpedia.org      "dasei";
    raumlauf.theaterpedia.org   "raumlauf";
    
    # Custom domains
    dasei.eu        "dasei";
    www.dasei.eu    "dasei";
}
```

### Server Block

The main server block in `/etc/nginx/sites-available/crearis-vue` uses the mapped `$domaincode` to rewrite URLs:

```nginx
location / {
    if ($domaincode != "") {
        rewrite ^/$ /sites/$domaincode break;
        rewrite ^/posts/(.*)$ /sites/$domaincode/posts/$1 break;
        rewrite ^/events/(.*)$ /sites/$domaincode/events/$1 break;
    }
    
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header X-Domain-Code $domaincode;
}
```

## URL Mapping

When a custom domain is configured, URLs are rewritten:

| Request | Internal Route |
|---------|---------------|
| `https://dasei.eu/` | `/sites/dasei` |
| `https://dasei.eu/posts/123` | `/sites/dasei/posts/123` |
| `https://dasei.eu/events/456` | `/sites/dasei/events/456` |

## Database Schema

### domains table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| domainname | TEXT | Full domain (computed) |
| textdomain | TEXT | Subdomain part |
| tld | TEXT | Top-level domain |
| sysdomain_id | INTEGER | FK to sysdomains (for subdomains) |
| project_id | INTEGER | FK to projects |
| description | TEXT | Optional description |

### sysdomains table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| domain | TEXT | Base domain (e.g., "theaterpedia") |
| tld | TEXT | TLD (e.g., "org") |
| domainstring | TEXT | Computed full domain |

## Troubleshooting

### DNS not propagating

- Wait up to 60 minutes for propagation
- Check with `dig domain.com` or online tools
- Verify A record points to correct IP

### SSL certificate fails

```bash
# Check certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Verify DNS first
dig +short domain.com
```

### Domain not routing

```bash
# Check nginx map
grep "domain.com" /etc/nginx/conf.d/domain-map.conf

# Test nginx config
sudo nginx -t

# Check nginx logs
sudo tail -f /opt/crearis/logs/nginx-error.log
```

### Subdomain not working

Ensure wildcard SSL certificate exists for the parent domain:

```bash
sudo certbot certificates | grep -A5 "theaterpedia.org"
```

## API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/domains` | GET | List all domains |
| `/api/admin/domains` | POST | Create domain |
| `/api/admin/domains/:id` | PUT | Update domain |
| `/api/admin/domains/:id` | DELETE | Delete domain |
| `/api/admin/domains/sysdomains` | GET | List system domains |
| `/api/admin/domains/check-dns` | GET | Verify DNS config |
