# 🔧 Alternative Deployment Methods

This document covers alternative deployment strategies for Crearis Vue beyond the recommended PM2 approach.

## ⚠️ Database Requirements

**🔴 SQLite Support is OUTDATED and NOT SUPPORTED**

- The current codebase has evolved to depend on PostgreSQL-specific features
- **JSONB field types** are extensively used throughout the application
- SQLite compatibility would require significant refactoring and development work
- **PostgreSQL is the ONLY supported database** for all deployment methods

**✅ PostgreSQL 12+ is REQUIRED** for all deployments (development and production)

---

## Option 1: Simple Node.js Server

**Requirements:**
- Node.js 20+
- PostgreSQL 12+ (✅ REQUIRED - SQLite is outdated)
- 1GB+ RAM
- 2GB+ disk space

**Deployment Steps:**
```bash
# 1. Upload .output directory to server
scp -r .output/ user@server:/var/www/crearis-vue/

# 2. Install Node.js on server (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Run the application
cd /var/www/crearis-vue/
node .output/server/index.mjs
```

**Environment Variables:**
```bash
DATABASE_TYPE=postgresql
DB_USER=crearis_prod
DB_PASSWORD=your_secure_password
DB_NAME=crearis_production
DB_HOST=localhost
DB_PORT=5432
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

## Option 2: Docker Container

**Create Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY .output ./

# Install PostgreSQL client (SQLite removed - outdated)
RUN apk add --no-cache postgresql-client

# Create data directory for application files
RUN mkdir -p /app/data

# Environment variables
ENV NODE_ENV=production
ENV DATABASE_TYPE=postgresql

EXPOSE 3000

CMD ["node", "/app/server/index.mjs"]
```

**Docker commands:**
```bash
# Build image
docker build -t crearis-vue .

# Run container with PostgreSQL connection
docker run -d \
  --name crearis-vue \
  -p 3000:3000 \
  -e DATABASE_TYPE=postgresql \
  -e DB_HOST=host.docker.internal \
  -e DB_USER=crearis_prod \
  -e DB_PASSWORD=your_password \
  -e DB_NAME=crearis_production \
  -v $(pwd)/data:/app/data \
  crearis-vue
```

**Docker Compose Example:**
```yaml
version: '3.8'
services:
  crearis-vue:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_TYPE=postgresql
      - DB_HOST=postgres
      - DB_USER=crearis_prod
      - DB_PASSWORD=your_secure_password
      - DB_NAME=crearis_production
    depends_on:
      - postgres
    volumes:
      - ./data:/app/data

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=crearis_prod
      - POSTGRES_PASSWORD=your_secure_password
      - POSTGRES_DB=crearis_production
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Option 3: Systemd Service

**Create service file:** `/etc/systemd/system/crearis-vue.service`
```ini
[Unit]
Description=Crearis Vue Application
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/crearis-vue
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=DATABASE_TYPE=postgresql
Environment=DB_HOST=localhost
Environment=DB_USER=crearis_prod
Environment=DB_NAME=crearis_production
Environment=PORT=3000
Environment=HOST=0.0.0.0
EnvironmentFile=-/var/www/crearis-vue/.env

[Install]
WantedBy=multi-user.target
```

**Enable and start service:**
```bash
sudo systemctl enable crearis-vue
sudo systemctl start crearis-vue
sudo systemctl status crearis-vue
```

## Option 4: Kubernetes Deployment

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crearis-vue
spec:
  replicas: 2
  selector:
    matchLabels:
      app: crearis-vue
  template:
    metadata:
      labels:
        app: crearis-vue
    spec:
      containers:
      - name: crearis-vue
        image: crearis-vue:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_TYPE
          value: "postgresql"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: host
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: DB_NAME
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: database
---
apiVersion: v1
kind: Service
metadata:
  name: crearis-vue-service
spec:
  selector:
    app: crearis-vue
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Option 5: Cloud Platform Deployments

### Heroku
```bash
# Install Heroku CLI and login
heroku create crearis-vue-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_TYPE=postgresql

# Deploy
git push heroku main
```

### Vercel
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": ".output/server/index.mjs",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": ".output/server/index.mjs"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_TYPE": "postgresql"
  }
}
```

### Railway
```toml
# railway.toml
[build]
  builder = "nixpacks"
  buildCommand = "pnpm build"

[deploy]
  startCommand = "node .output/server/index.mjs"
  restartPolicyType = "on_failure"
  restartPolicyMaxRetries = 10

[env]
  NODE_ENV = "production"
  DATABASE_TYPE = "postgresql"
```

## Monitoring and Logging

### Option 1: Winston + LogRotate
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});

module.exports = logger;
```

### Option 2: Docker Logging
```bash
# Configure Docker logging driver
docker run -d \
  --name crearis-vue \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  crearis-vue
```

### Option 3: ELK Stack Integration
```yaml
# docker-compose.yml with ELK
version: '3.8'
services:
  crearis-vue:
    build: .
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    depends_on:
      - elasticsearch

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

## Performance Optimization

### Nginx Caching
```nginx
# Caching static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# API response caching
location /api/ {
    proxy_pass http://localhost:3000;
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
}
```

### Load Balancing
```nginx
upstream crearis_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    location / {
        proxy_pass http://crearis_backend;
    }
}
```

## Security Hardening

### Firewall Configuration
```bash
# UFW firewall setup
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # Don't expose app port directly
sudo ufw enable
```

### SSL Certificate Management
```bash
# Let's Encrypt with auto-renewal
sudo certbot --nginx -d your-domain.com
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Application Security Headers
```nginx
# Security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
```

---

## Comparison Matrix

| Method | Complexity | Scalability | Monitoring | Cost | Best For |
|--------|------------|-------------|------------|------|----------|
| Simple Node.js | Low | Low | Basic | Low | Development/Testing |
| **PM2** | **Medium** | **Medium** | **Good** | **Low** | **Production (Recommended)** |
| Docker | Medium | High | Good | Medium | Containerized environments |
| Kubernetes | High | Very High | Excellent | High | Enterprise/Large scale |
| Systemd | Low | Low | Basic | Low | Simple Linux deployments |
| Cloud Platforms | Low | High | Excellent | Variable | Quick deployment/Scaling |

> **Recommendation**: For most production deployments, **PM2** offers the best balance of simplicity, reliability, and features. See the [main deployment guide](./DEPLOYMENT_GUIDE.md) for detailed PM2 setup instructions.