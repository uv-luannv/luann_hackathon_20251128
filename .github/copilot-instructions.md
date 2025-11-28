# 💻 Vue 3 + Hono + PostgreSQL Development Guide

**Tech Stack:** Vue 3 (Composition API) + Hono + PostgreSQL (Kysely) + Docker

**Requirements:**

- Code comments in Japanese (日本語)
- Docker services: `backend`, `frontend`, `postgres`
- Migrations: `docker compose exec backend npm run migrate`
- Generate types: `docker compose exec backend npm run db:generate-types`

## 🏗️ Architecture Patterns

**Backend (Hono + Kysely):**

- API Pattern: `export const store[Entity]Api = (app: OpenAPIHono)`
- Route Definition: `createRoute` from `@hono/zod-openapi`
- Handler: `app.openapi(route, handler)`
- Auth Middleware: `app.use('/api/[entity]/*', authMiddleware)`
- Response Format: Convert IDs to strings, use `{ success: false, message: string }`
- Queries: `executeTakeFirst()` for single, `execute()` for multiple
- Imports: Include auth middleware, schemas, db connection

**Frontend (Vue 3):**

- Pattern: `<script setup>` with Composition API
- HTTP Client: `api` instance from `@/services/api.ts`
- State: `ref()` for reactive data, Pinia stores for global state
- Error Handling: try/catch blocks
- Imports: Use existing stores, TypeScript types
- UI: Follow existing component patterns with shadcn/ui components

## 🚀 Development Workflow

**Before coding, run these checks:**

```bash
# Check existing patterns
grep_search "storeItemApi|storeUserApi" apps/backend/src/apis/
read_file apps/backend/src/schemas/items.ts

# Check migration format
file_search "**/migrations/*.ts"
read_file apps/backend/src/db/generated-types.ts
```

**Backend Task Implementation:**

1. **Migration** (`YYYYMMDDTHHMMSSZ-create-tasks.ts`):

   - Schema: `id` (serial), `title` (varchar 255), `description` (text), `is_completed` (boolean), `created_at` (timestamp)
   - Include `up`/`down` functions, indexes

2. **Schema** (`apps/backend/src/schemas/tasks.ts`):

   - Zod schemas for validation with OpenAPI examples

3. **API Routes** (`apps/backend/src/apis/tasks.ts`):

   - Add auth middleware: `app.use('/api/tasks/*', authMiddleware)`
   - `POST /api/tasks` - Create task (validate title required)
   - `GET /api/tasks` - List tasks (optional status filter)
   - `PATCH /api/tasks/{id}` - Toggle completion status
   - Function naming: `storeCreateTaskRoute`, `storeGetTasksRoute`, `storePatchTaskRoute`

4. **Registration**:
   - Export from `apps/backend/src/apis/index.ts`
   - Register in `apps/backend/src/app.ts`

**Frontend Task Implementation:**

- **Store** (`apps/frontend/src/stores/tasks.store.ts`): Create Pinia store for tasks
- **Component** (`apps/frontend/src/components/TaskList.vue`):
  - Import and use task store: `const tasksStore = useTasksStore()`
  - `fetchTasks()` function with `onMounted`
  - `toggleTaskStatus(id: string)` method
  - Reactive `tasks` from store
  - Follow existing patterns from ItemList.vue structure

**Validation Commands:**

```bash
# After implementation
docker compose exec backend npm run migrate
docker compose exec backend npm run db:generate-types
docker compose exec backend npm run build
docker compose exec frontend npm run build
```

**Integration Checklist:**

- [ ] Migration file created with timestamp
- [ ] Schema file created in `apps/backend/src/schemas/tasks.ts`
- [ ] API file created in `apps/backend/src/apis/tasks.ts`
- [ ] API exported from `apps/backend/src/apis/index.ts`
- [ ] API registered in `apps/backend/src/app.ts`
- [ ] TypeScript types created in `apps/frontend/src/types/task.types.ts`
- [ ] Service created in `apps/frontend/src/services/tasks.service.ts`
- [ ] Pinia store created in `apps/frontend/src/stores/tasks.store.ts`
- [ ] Component created in `apps/frontend/src/components/TaskList.vue`
- [ ] All comments in Japanese
