# Workflows

## Local development
1. Install dependencies: `pnpm install`
2. Create env files from examples in `apps/server/.env.example`, `apps/web/.env.example`, and `apps/mobile/.env.example`
3. Run database migrations:
   - `cd apps/server`
   - `uv pip install -e .`
   - `FLASK_APP=app:create_app flask db upgrade`
4. Start all apps: `pnpm dev`

## Add a new endpoint
1. Add route handlers in `apps/server/app/app.py`.
2. Add/update schemas or models in `apps/server/app/models.py`.
3. Run `flask db migrate` and `flask db upgrade` if models changed.
4. Update `docs/api.md`.

## Add a shared type
1. Add the type to `packages/shared/src/index.ts`.
2. Run `pnpm -C packages/shared build` or rely on `pnpm dev` to rebuild.
3. Use the type in `apps/web` and `apps/mobile`.

## Add a new screen/page
- Web: Create a new component in `apps/web/src`, update routing if needed.
- Mobile: Add a new screen component in `apps/mobile` and wire it into your navigator.

## Release checklist
- Run `pnpm lint` and `pnpm build`.
- Run migrations in production.
- Verify `/health` and `/api/v1/health`.
- Update `docs/api.md` if endpoints changed.
