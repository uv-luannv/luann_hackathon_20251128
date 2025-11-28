# 📝 Quiz App Development Guide

This document outlines the development process for building the Quiz App, following the architecture defined in `copilot-instructions.md`.

**Tech Stack:** Vue 3 (Composition API) + Hono + PostgreSQL (Kysely) + Docker

---

## 🚀 Development Workflow

The development will be broken down into features based on the `Requirement.md`. For each feature, we will implement the backend (database migration, API) and then the frontend (services, stores, components).

### ✅ General Checklist (Before Starting)

1.  **Review Existing Patterns:** Familiarize yourself with the existing code for `items` and `users` to maintain consistency.
    ```bash
    grep -r "storeUserApi" apps/backend/src/apis/
    grep -r "storeCreateItem" apps/backend/src/apis/items.ts
    ```
2.  **Understand Schema Definitions:** Check how Zod schemas are defined for validation and OpenAPI generation.
    ```bash
    read_file apps/backend/src/schemas/items.ts
    ```
3.  **Check Migration Format:** Look at existing migration files to understand the structure.
    ```bash
    ls -l apps/backend/src/db/migrations/
    ```

---

## 📜 Feature 1: Quiz Set & Question Management (FR-002, FR-003)

### Backend Implementation

#### 1. Database Migrations

Create migration files for `quiz_sets`, `questions`, and `choices`.

- **File 1: `apps/backend/src/db/migrations/YYYYMMDDTHHMMSSZ-create-quiz-sets.ts`**

  - **Table:** `quiz_sets`
  - **Columns:**
    - `id`: `serial`, primary key
    - `title`: `varchar(255)`, not null
    - `description`: `text`
    - `category`: `varchar(100)`
    - `is_public`: `boolean`, default `false`, not null
    - `author_id`: `integer`, references `users(id)`
    - `created_at`: `timestamp`, default `now()`
    - `updated_at`: `timestamp`, default `now()`
  - **Indexes:** `author_id`, `is_public`

- **File 2: `apps/backend/src/db/migrations/YYYYMMDDTHHMMSSZ-create-questions.ts`**

  - **Table:** `questions`
  - **Columns:**
    - `id`: `serial`, primary key
    - `quiz_set_id`: `integer`, references `quiz_sets(id)` on delete cascade
    - `question_text`: `text`, not null
    - `created_at`: `timestamp`, default `now()`
    - `updated_at`: `timestamp`, default `now()`
  - **Indexes:** `quiz_set_id`

- **File 3: `apps/backend/src/db/migrations/YYYYMMDDTHHMMSSZ-create-choices.ts`**
  - **Table:** `choices`
  - **Columns:**
    - `id`: `serial`, primary key
    - `question_id`: `integer`, references `questions(id)` on delete cascade
    - `choice_text`: `varchar(255)`, not null
    - `is_correct`: `boolean`, not null
  - **Indexes:** `question_id`

#### 2. Run Migrations & Generate Types

After creating the migration files, apply them and generate the corresponding TypeScript types.

**Validation:**

```bash
# Apply migrations
docker compose exec backend npm run migrate

# Generate DB types
docker compose exec backend npm run db:generate-types

# Verify new types in generated-types.ts
grep -E "QuizSets|Questions|Choices" apps/backend/src/db/generated-types.ts
```

#### 3. Backend API (Quiz Sets)

- **Schema (`apps/backend/src/schemas/quiz_sets.ts`):** Create Zod schemas for `QuizSet` creation, update, and response.
- **API (`apps/backend/src/apis/quiz_sets.ts`):**
  - `POST /api/quiz-sets`: Create a new quiz set.
  - `GET /api/quiz-sets`: List all public quiz sets. Authenticated users can see their own private sets.
  - `GET /api/quiz-sets/{id}`: Get details of a single quiz set.
  - `PATCH /api/quiz-sets/{id}`: Update a quiz set's details (title, description, etc.).
  - `PATCH /api/quiz-sets/{id}/publish`: Toggle the `is_public` status.
  - `DELETE /api/quiz-sets/{id}`: Delete a quiz set.
- **Registration:**
  - Export the API from `apps/backend/src/apis/index.ts`.
  - Register the API in `apps/backend/src/app.ts`.

#### 4. Backend API (Questions & Choices)

- **Schema (`apps/backend/src/schemas/questions.ts`):** Create Zod schemas for `Question` and `Choice` creation. A question should have exactly 4 choices, with one marked as correct.
- **API (`apps/backend/src/apis/questions.ts`):**
  - `POST /api/quiz-sets/{quizSetId}/questions`: Add a question with its 4 choices to a quiz set.
  - `GET /api/quiz-sets/{quizSetId}/questions`: List all questions for a quiz set (for the author).
  - `PATCH /api/questions/{id}`: Update a question and its choices.
  - `DELETE /api/questions/{id}`: Delete a question.
- **Registration:**
  - Export and register the API in `apps/backend/src/apis/index.ts` and `apps/backend/src/app.ts`.

**Validation:**

```bash
# Build the backend to check for compilation errors
docker compose exec backend npm run build
```

### Frontend Implementation

#### 1. Types, Services, and Stores

- **Types (`apps/frontend/src/types/`):** Create `quiz.types.ts` and `question.types.ts`.
- **Services (`apps/frontend/src/services/`):** Create `quiz.service.ts` and `question.service.ts` to interact with the new backend APIs.
- **Stores (`apps/frontend/src/stores/`):** Create `quiz.store.ts` to manage quiz set and question state.

#### 2. Components

- `QuizSetList.vue`: Display a list of quiz sets.
- `QuizSetCreateDialog.vue`: A dialog to create a new quiz set.
- `QuizSetEditView.vue`: A view to edit a quiz set and manage its questions.
- `QuestionManager.vue`: A component within `QuizSetEditView` to add/edit/delete questions and choices.

**Validation:**

```bash
# Build the frontend to check for compilation errors
docker compose exec frontend npm run build
```

---

## 📜 Feature 2: Quiz Challenge & Scoring (FR-004, FR-005)

### Backend Implementation

#### 1. Database Migrations

- **File 1: `apps/backend/src/db/migrations/YYYYMMDDTHHMMSSZ-create-challenges.ts`**

  - **Table:** `challenges`
  - **Columns:**
    - `id`: `serial`, primary key
    - `user_id`: `integer`, references `users(id)`
    - `quiz_set_id`: `integer`, references `quiz_sets(id)`
    - `score`: `integer`, not null
    - `is_first_attempt`: `boolean`, not null
    - `created_at`: `timestamp`, default `now()`
  - **Indexes:** `user_id`, `quiz_set_id`

- **File 2: `apps/backend/src/db/migrations/YYYYMMDDTHHMMSSZ-create-challenge-answers.ts`**
  - **Table:** `challenge_answers`
  - **Columns:**
    - `id`: `serial`, primary key
    - `challenge_id`: `integer`, references `challenges(id)` on delete cascade
    - `question_id`: `integer`, references `questions(id)`
    - `choice_id`: `integer`, references `choices(id)`
  - **Indexes:** `challenge_id`

#### 2. Run Migrations & Generate Types

**Validation:**

```bash
docker compose exec backend npm run migrate
docker compose exec backend npm run db:generate-types
grep -E "Challenges|ChallengeAnswers" apps/backend/src/db/generated-types.ts
```

#### 3. Backend API

- **Schema (`apps/backend/src/schemas/challenges.ts`):** Zod schemas for challenge submission and results.
- **API (`apps/backend/src/apis/challenges.ts`):**
  - `GET /api/quiz-sets/{id}/challenge/start`: Get questions for a quiz set to start a challenge (without correct answers).
  - `POST /api/quiz-sets/{id}/challenge/submit`: Submit answers, calculate score, and save the challenge record.
  - `GET /api/challenges/{id}/result`: Get the result of a completed challenge.
  - `GET /api/quiz-sets/{id}/ranking`: Get the top 10 user scores (first attempt only).
  - `GET /api/my-scores`: Get the current user's score history.
- **Registration:** Register the new API.

**Validation:**

```bash
docker compose exec backend npm run build
```

### Frontend Implementation

#### 1. Services and Stores

- **Service (`apps/frontend/src/services/challenge.service.ts`):** Service for challenge-related API calls.
- **Store (`apps/frontend/src/stores/challenge.store.ts`):** State management for the quiz-taking process.

#### 2. Components

- `QuizChallengeView.vue`: The main view for taking a quiz.
- `QuizResultDialog.vue`: A dialog to show the score and correct answers after submission.
- `QuizRanking.vue`: A component to display the leaderboard for a quiz set.
- `MyScoresView.vue`: A view for users to see their past scores.

**Validation:**

```bash
docker compose exec frontend npm run build
```

---

## 📜 Feature 3: Star Ratings (FR-006)

### Backend Implementation

#### 1. Database Migration

- **File: `apps/backend/src/db/migrations/YYYYMMDDTHHMMSSZ-create-ratings.ts`**
  - **Table:** `ratings`
  - **Columns:**
    - `id`: `serial`, primary key
    - `user_id`: `integer`, references `users(id)`
    - `quiz_set_id`: `integer`, references `quiz_sets(id)` on delete cascade
    - `rating`: `integer`, not null (check between 1 and 5)
    - `created_at`: `timestamp`, default `now()`
    - `updated_at`: `timestamp`, default `now()`
  - **Constraints:** Unique constraint on (`user_id`, `quiz_set_id`).

#### 2. Run Migrations & Generate Types

**Validation:**

```bash
docker compose exec backend npm run migrate
docker compose exec backend npm run db:generate-types
grep "Ratings" apps/backend/src/db/generated-types.ts
```

#### 3. Backend API

- **Schema (`apps/backend/src/schemas/ratings.ts`):** Zod schema for submitting a rating.
- **API (`apps/backend/src/apis/ratings.ts`):**
  - `POST /api/quiz-sets/{id}/rate`: Create or update a rating for a quiz set.
- **Logic Update:** Modify the `GET /api/quiz-sets` and `GET /api/quiz-sets/{id}` endpoints to calculate and include the average rating.
- **Registration:** Register the new API.

**Validation:**

```bash
docker compose exec backend npm run build
```

### Frontend Implementation

#### 1. Services and Stores

- **Service (`apps/frontend/src/services/rating.service.ts`):** Service for submitting ratings.
- **Store Update:** Update `quiz.store.ts` to handle rating submissions.

#### 2. Components

- `StarRating.vue`: A reusable component for displaying and submitting star ratings.
- **UI Updates:** Integrate the `StarRating` component into `QuizSetList.vue` and the quiz set detail view.

**Validation:**

```bash
docker compose exec frontend npm run build
```
