# 💻 Specialized Prompt: Vue 3 + Hono + PostgreSQL (Kysely) Development for Task Management

This prompt guides the development of a full-stack application managing **Task Lists**. The final output should be three distinct code blocks as specified in the deliverables section.

---

### 1. 🎯 Project Goal & Context

**Objective:** Develop a robust, scalable web application that manages **Task Lists**. The solution must utilize **Vue 3** (Composition API, `<script setup>`) for the frontend, a **Hono** API layer (using **TypeScript**) for the backend, and **PostgreSQL** (via **Kysely** Query Builder) for data persistence.

**Language Requirement Check:**

- **Thinking Process:** Must be conducted **exclusively in English**.
- **Code Comments:** All code comments, including JS/TS Doc strings and inline comments, must be written **in Japanese** (日本語).

**Docker Environment Interaction:**
- The project runs in a Docker environment managed by `compose.yml`.
- Service names are `backend`, `frontend`, `postgres`.
- To run database migrations, execute the following command from the project root on the host machine: `docker compose exec backend npm run migrate`.
- To generate Kysely types after a migration, run: `docker compose exec backend npm run db:generate-types`.

**🏗️ Architecture Overview:**

**Backend Structure:**
- **Framework:** Hono with `@hono/zod-openapi` for OpenAPI spec generation
- **Database:** Kysely with PostgreSQL
- **API Pattern:** Each API module exports a `store[Entity]Api` function that registers routes
- **Route Structure:** Uses `createRoute` from `@hono/zod-openapi` for route definition
- **Authentication:** JWT-based auth with middleware (`authMiddleware`)
- **File Organization:**
  ```
  apps/backend/src/
  ├── apis/           # API route handlers (users.ts, items.ts, tasks.ts)
  ├── schemas/        # Zod validation schemas
  ├── db/            # Database connection, migrations, types
  ├── middleware/    # Auth middleware
  ├── utils/         # Helper utilities
  └── app.ts         # Main app configuration
  ```

**Frontend Structure:**
- **Framework:** Vue 3 with Composition API (`<script setup>`)
- **HTTP Client:** `ofetch` configured in `services/api.ts`
- **State Management:** Pinia stores
- **UI Components:** Custom components with shadcn/ui-style structure
- **File Organization:**
  ```
  apps/frontend/src/
  ├── components/     # UI components (ItemList.vue, TaskList.vue)
  ├── services/       # API service layer
  ├── stores/         # Pinia stores
  ├── types/          # TypeScript type definitions
  └── views/          # Page components
  ```

---

### 2. 🚀 Backend (Hono & PostgreSQL) Development

**Task:** Design and implement a RESTful API using Hono to handle CRUD operations for the `Task` entity.

- **API Framework:** Hono (Targeting Node.js).
- **Database:** PostgreSQL.
- **Query Builder:** Use **Kysely** for type safety and database interactions.

#### 2.1. 💾 Database Schema & SQL (Kysely Migration)

- **Entity:** `Task`
- **Schema Design:** Define the initial schema for the `tasks` table.
  - `id`: Primary Key (Serial INT)
  - `title`: Varchar (required, max 255)
  - `description`: Text (optional)
  - `is_completed`: Boolean (default to FALSE)
  - `created_at`: Timestamp (default to current time)

**Deliverable 1: Kysely Migration and Raw SQL**
Provide the Kysely migration TypeScript file for creating the `tasks` table and the corresponding raw SQL `CREATE TABLE` statement.

**Migration File Pattern:**
- Filename format: `YYYYMMDDTHHMMSSZ-create-tasks.ts` (use current timestamp)
- Include both `up` and `down` functions
- Add appropriate indexes for performance
- Use `serial` for auto-incrementing primary keys
- Use `varchar(255)` for title, `text` for description
- Set proper default values and constraints

#### 2.2. ⚙️ Hono Logic Implementation

**Endpoints Required:** Implement the following routes in a new file `apps/backend/src/apis/tasks.ts`.

| HTTP Method | Path             | Description             | Required Logic & Notes                                                                                                                                                                                                     |
| :---------- | :--------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`      | `/api/tasks`     | Create a new task.      | Must use **Zod** for request body validation (`title` required, `description` optional). Use **Kysely** to insert the new task. Return **HTTP 201** on success with the created task object.                          |
| `GET`       | `/api/tasks`     | Retrieve all tasks.     | Implement optional query parameters: `status` (to filter by `is_completed: 'true'/'false'`). Use **Kysely** to fetch data. Default should return all tasks. Return **HTTP 200**.                                      |
| `PATCH`     | `/api/tasks/{id}` | Update a task's status. | Specifically implement logic to toggle the `is_completed` status based on the current value for the task ID provided in the URL parameter. Use **`c.req.param('id')`** and Kysely's `update` method. Return **HTTP 200**. |

**API Pattern to Follow:**
- Export main function as `storeTaskApi(app: OpenAPIHono)`
- Use separate internal functions for each route: `storeCreateTaskRoute`, `storeGetTasksRoute`, `storePatchTaskRoute`
- Use `createRoute` from `@hono/zod-openapi` for route definition
- Use `app.openapi(route, handler)` pattern for implementation
- Follow error response format: `{ success: false, message: string, error?: string }`
- Convert database IDs to strings in responses
- Use `executeTakeFirst()` for single record queries, `execute()` for multiple records

**Development Notes (Backend):**

- **Error Handling:** Implement basic global error handling in Hono to catch database connection issues or validation failures, returning appropriate HTTP error codes (e.g., 400 for bad request, 500 for server error).
- **File Structure:** Create new files for schemas (`apps/backend/src/schemas/tasks.ts`) and API logic (`apps/backend/src/apis/tasks.ts`) following the existing project structure.
- **API Registration:** Remember to export the new API function from `apps/backend/src/apis/index.ts` and register it in `apps/backend/src/app.ts`.

**🔍 Template Commands for Code Generation:**

**IMPORTANT:** Before generating any code, Copilot should run these commands to understand the current codebase structure:

1. **Check existing API patterns:**
   ```bash
   # Review existing API implementation
   grep_search "storeItemApi\|storeUserApi" apps/backend/src/apis/
   ```

2. **Check existing schema patterns:**
   ```bash
   # Review existing schema structure
   read_file apps/backend/src/schemas/items.ts
   ```

3. **Check database migration format:**
   ```bash
   # Review existing migration format
   file_search "**/migrations/*.ts"
   read_file apps/backend/src/db/migrations/[latest-migration].ts
   ```

4. **Check current database schema:**
   ```bash
   # Check generated types to understand current DB schema
   read_file apps/backend/src/db/generated-types.ts
   ```

5. **Verify Docker services are running:**
   ```bash
   # Check if services are running before testing
   run_in_terminal "docker compose ps" "Check Docker services status"
   ```

**Deliverable 2: Hono Router and Database Code**
Provide the **Hono router file** (`tasks.ts`) showing the route handlers and the associated database interaction logic (Kysely calls). **Remember to use Japanese for all comments.**

---

### 3. 🌟 Frontend (Vue 3) Development

**Task:** Create a simple Vue application to consume the Task API.

- **Framework:** Vue 3 (Composition API, `<script setup>`).
- **State Management:** Use reactive references (`ref()`) for local component state.
- **API Client:** Use the native **`fetch`** API for HTTP requests.

#### 3.1. ⚙️ Vue Component Logic

- **`TaskList.vue`:**
  - Implement an asynchronous function (`fetchTasks`) to get all tasks from `/api/tasks`.
  - Use `onMounted` to call `fetchTasks` and populate a reactive array (`tasks: Ref<Task[]>`).
  - Implement the `toggleTaskStatus(id: string)` method to call the `PATCH /api/tasks/{id}` endpoint.
  - After a successful `PATCH`, call `fetchTasks` again to update the UI (simple list refresh approach).
  - Render the tasks in a list/table, showing the title and the current completion status.

**Frontend Pattern to Follow:**
- Use `<script setup>` syntax with Composition API
- Import API functions from services layer (follow `services/api.ts` pattern)
- Use `ref()` for reactive data
- Use proper TypeScript typing for all variables
- Follow existing component structure (template, script, style if needed)
- Use consistent error handling with try/catch

**Development Notes (Frontend):**

- **HTTP Client:** Use the existing `api` instance from `@/services/api.ts` instead of native fetch
- **Reactivity:** Ensure the task list automatically updates upon data fetching.
- **Error Handling:** Use `try...catch` blocks for all API calls.
- **Base URL:** API calls automatically use the configured base URL from environment variables.

**Deliverable 3: Vue Component Code**
Provide the complete code for a new **`TaskList.vue`** component, showing the data fetching, status toggling logic, and basic template structure. **Remember to use Japanese for all comments.**

---

### 4. 🛑 Exclusions & Final Deliverables

**Exclusions:**

- Do not create any unit test files or test code.
- Do not create any Storybook configurations or component stories.
- No styling (CSS) is required; basic HTML structure is sufficient.

**🧪 Testing & Validation Commands:**

**After generating code, run these commands to validate integration:**

1. **Run migration and generate types:**
   ```bash
   docker compose exec backend npm run migrate
   docker compose exec backend npm run db:generate-types
   ```

2. **Check for compilation errors:**
   ```bash
   docker compose exec backend npm run build
   docker compose exec frontend npm run build
   ```

3. **Test API endpoints:**
   ```bash
   # Test GET endpoint
   run_in_terminal "curl -X GET http://localhost:3000/api/tasks" "Test GET /api/tasks endpoint"
   
   # Test POST endpoint
   run_in_terminal "curl -X POST http://localhost:3000/api/tasks -H 'Content-Type: application/json' -d '{\"title\": \"Test Task\", \"description\": \"Test Description\"}'" "Test POST /api/tasks endpoint"
   ```

4. **Verify API registration:**
   ```bash
   grep_search "storeTaskApi" apps/backend/src/
   ```

**Final Deliverables Summary (Code Blocks):**

1.  **Kysely/Postgres Migration** and raw SQL.
2.  **Hono Backend Code** (Router and Logic).
3.  **Vue Frontend Component Code** (`TaskList.vue`).

**📋 Integration Checklist:**

**Backend Integration:**
- [ ] Migration file created with correct timestamp format
- [ ] Schema file created in `apps/backend/src/schemas/tasks.ts`
- [ ] API file created in `apps/backend/src/apis/tasks.ts`
- [ ] API function exported from `apps/backend/src/apis/index.ts`
- [ ] API function registered in `apps/backend/src/app.ts`
- [ ] Types regenerated after migration

**Frontend Integration:**
- [ ] Component created in `apps/frontend/src/components/TaskList.vue`
- [ ] Proper imports from existing services
- [ ] TypeScript types defined or imported
- [ ] Error handling implemented
- [ ] Reactive data updates working
