# nush

Production-minded monorepo with a Flask API, React (Vite) web app, Expo mobile app, and a shared TypeScript package.

## Start .venv

cd apps/server
source .venv/bin/activate


## Prerequisites
- Node.js 20+
- pnpm 9+
- Python 3.11+
- uv (`pip install uv`)

## Setup
```bash
pnpm install

# Server env
cp apps/server/.env.example apps/server/.env

# Web env
cp apps/web/.env.example apps/web/.env

# Mobile env
cp apps/mobile/.env.example apps/mobile/.env
```

## Server setup
```bash
cd apps/server
uv pip install -e .[dev]
FLASK_APP=app:create_app flask db upgrade
```

## Run everything
```bash
pnpm dev
```

## Run server only
```bash
pnpm dev:server
```

## Run web only
```bash
pnpm dev:web
```

## Run mobile only
```bash
pnpm dev:mobile
```
i
## Fix mobile Metro cache
```bash
pnpm -C apps/mobile start -- --clear
```

## Useful commands
- `pnpm dev:server`
- `pnpm dev:web`
- `pnpm dev:mobile`
- `pnpm lint`
- `pnpm build`

## Notes
- If you run the mobile app on a device, set `EXPO_PUBLIC_API_URL` to your machine's LAN IP.
- The dev server defaults to port 5001. Set `VITE_API_URL` or `EXPO_PUBLIC_API_URL` if you need a different port.
- The API health endpoint is available at `/health` and `/api/v1/health`.
# nush
