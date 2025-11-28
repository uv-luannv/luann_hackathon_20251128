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
- Response Format: Convert IDs to strings, use `{ success: false, message: string }`
- Queries: `executeTakeFirst()` for single, `execute()` for multiple

**Frontend (Vue 3):**

- Pattern: `<script setup>` with Composition API
- HTTP Client: `api` instance from `@/services/api.ts`
- State: `ref()` for reactive data
- Error Handling: try/catch blocks

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

   - `POST /api/tasks` - Create task (validate title required)
   - `GET /api/tasks` - List tasks (optional status filter)
   - `PATCH /api/tasks/{id}` - Toggle completion status

4. **Registration**:
   - Export from `apps/backend/src/apis/index.ts`
   - Register in `apps/backend/src/app.ts`

**Frontend Task Implementation:**

- **Component** (`apps/frontend/src/components/TaskList.vue`):
  - `fetchTasks()` function with `onMounted`
  - `toggleTaskStatus(id: string)` method
  - Reactive `tasks: Ref<Task[]>` array
  - Use existing `api` instance, not fetch

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
- [ ] Schema, API files created in correct paths
- [ ] API exported and registered in app.ts
- [ ] Component uses existing patterns
- [ ] All comments in Japanese
