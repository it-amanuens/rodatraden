# Röda Tråden Production Setup Guide

> **Note:** This guide was originally written for a specific deployment at Teknisk Fysik, Umeå University
> (running at `rt.tekniskfysik.se` on a single Linux server). File paths such as `/root/3dlabbetwiki/`
> and service names like `3dlabbetwiki-reverse-proxy-1` are specific to that environment.
> Adapt paths, service names, hostnames, and Docker Compose file locations to match your own deployment.

## Architecture Overview

```
Internet → Traefik (reverse proxy) → Docker containers
                ↓
    ┌───────────────────────────────────────┐
    │  <your-domain> → rodatraden:8000      │
    └───────────────────────────────────────┘
```

- **Traefik** handles SSL certificates (Let's Encrypt) and routes traffic
- **Django app** runs with Gunicorn (production WSGI server) in Docker
- **WhiteNoise** serves static files directly from Django

---

## File Locations

| Component | Path |
|-----------|------|
| Docker Compose | `/root/3dlabbetwiki/docker-compose.yml` |
| Django App | `/root/rodatraden/` |
| Dockerfile | `/root/rodatraden/Dockerfile` |
| SSL Certificates | `/root/3dlabbetwiki/letsencrypt/` |
| Database | `/root/rodatraden/mydatabase` (SQLite) |

---

## Common Commands

### Start all services
```bash
cd /root/3dlabbetwiki && docker compose up -d
```

### Stop all services
```bash
cd /root/3dlabbetwiki && docker compose down
```

### View logs
```bash
# All services
docker compose logs -f

# Just rodatraden
docker logs -f rodatraden

# Just traefik
docker logs -f 3dlabbetwiki-reverse-proxy-1
```

### Restart rodatraden
```bash
docker compose restart rodatraden
```

---

## Updating Code

### After making code changes:
```bash
cd /root/3dlabbetwiki && docker compose up -d --build rodatraden
```

This will:
1. Rebuild the Docker image with new code
2. Run `collectstatic` automatically
3. Restart the container

### If you only changed Python code (no new dependencies):
```bash
docker compose restart rodatraden
```
*(Note: This only works because we mount the code as a volume)*

### If you added new Python packages:
1. Add them to `/root/rodatraden/requirements.txt`
2. Rebuild: `docker compose up -d --build rodatraden`

---

## Database

The database is SQLite stored at `/root/rodatraden/mydatabase`.

### Run migrations
```bash
docker exec rodatraden python manage.py migrate
```

### Create superuser
```bash
docker exec -it rodatraden python manage.py createsuperuser
```

### Backup database
```bash
cp /root/rodatraden/mydatabase /root/rodatraden/mydatabase.backup
```

---

## Static Files

If you add new static files (images, CSS, JS):
```bash
docker exec rodatraden python manage.py collectstatic --noinput
```

Or rebuild the container (collectstatic runs automatically during build).

---

## Running Django Management Commands

### Via Docker (recommended for production)
```bash
docker exec rodatraden python manage.py <command>
```

### Via local venv (for development/scripts)
```bash
cd /root/rodatraden
source env/bin/activate
python manage.py <command>
```

Both work because they share the same database file!

---

## Key Configuration Files

### `/root/rodatraden/tf/settings.py`
- `DEBUG = False` for production
- `ALLOWED_HOSTS` - domains that can access the site
- `CSRF_TRUSTED_ORIGINS` - for HTTPS POST requests
- `SECURE_PROXY_SSL_HEADER` - trusts Traefik's HTTPS headers

### `/root/rodatraden/Dockerfile`
```dockerfile
FROM python:3.12-slim
# Installs dependencies, runs collectstatic, starts Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "tf.wsgi:application"]
```

### Docker Compose (rodatraden service)
- Routes `rt.tekniskfysik.se` via Traefik labels
- Mounts code directory for live updates
- Auto-restarts on failure

---

## Adding a New Domain/Route

To add another service to Traefik, add a new service in `docker-compose.yml` with labels:
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.myservice.rule=Host(`myservice.tekniskfysik.se`)"
  - "traefik.http.routers.myservice.entrypoints=websecure"
  - "traefik.http.routers.myservice.tls=true"
  - "traefik.http.routers.myservice.tls.certresolver=myresolver"
  - "traefik.http.services.myservice.loadbalancer.server.port=8000"
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 502 Bad Gateway | Check if container is running: `docker ps` |
| Static files 404 | Run `collectstatic` or rebuild |
| CSRF errors | Check `CSRF_TRUSTED_ORIGINS` in settings |
| SSL issues | Check Traefik logs, verify DNS |
| Database issues | Both Docker and venv use same `/root/rodatraden/mydatabase` |
