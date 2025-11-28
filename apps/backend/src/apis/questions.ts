import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { authMiddleware } from '../middleware/auth.js';
import { 
  QuestionListSchema,
  QuestionParamsSchema,
  QuestionSchema,
  CreateQuestionSchema,
  UpdateQuestionSchema,
  QuizSetIdParamsSchema
} from '../schemas/questions.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { db } from '../db/connection.js';

export const storeQuestionApi = (app: OpenAPIHono) => {
  app.use('/api/quiz-sets/*', authMiddleware);
  app.use('/api/questions/*', authMiddleware);
  storeGetQuestionsRoute(app);
  storeCreateQuestionRoute(app);
  storeUpdateQuestionRoute(app);
  storeDeleteQuestionRoute(app);
};

const storeGetQuestionsRoute = (app: OpenAPIHono) => {
  // GET /api/quiz-sets/{quizSetId}/questions ルート定義
  const getQuestionsRoute = createRoute({
    method: 'get',
    path: '/api/quiz-sets/{quizSetId}/questions',
    request: { params: QuizSetIdParamsSchema },
    responses: {
      200: {
        content: { 'application/json': { schema: QuestionListSchema } },
        description: '質問一覧を取得'
      },
      403: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アクセス権限がありません'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'クイズセットが見つからない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/quiz-sets/{quizSetId}/questions エンドポイント実装
  app.openapi(getQuestionsRoute, async (c) => {
    const { quizSetId } = c.req.valid('param');
    const user = (c as any).get('user');

    try {
      // クイズセットの存在確認と権限チェック
      const quizSet = await db
        .selectFrom('quiz_sets')
        .select(['author_id'])
        .where('id', '=', parseInt(quizSetId))
        .executeTakeFirst();

      if (!quizSet) {
        return c.json({
          success: false,
          message: 'Quiz set not found'
        }, 404);
      }

      if (quizSet.author_id !== user.id) {
        return c.json({
          success: false,
          message: 'Access denied'
        }, 403);
      }

      // 質問と選択肢を取得
      const questions = await db
        .selectFrom('questions')
        .leftJoin('choices', 'choices.question_id', 'questions.id')
        .select([
          'questions.id as question_id',
          'questions.quiz_set_id',
          'questions.question_text',
          'questions.created_at as question_created_at',
          'questions.updated_at as question_updated_at',
          'choices.id as choice_id',
          'choices.choice_text',
          'choices.is_correct'
        ])
        .where('questions.quiz_set_id', '=', parseInt(quizSetId))
        .orderBy('questions.id', 'asc')
        .orderBy('choices.id', 'asc')
        .execute();

      // 質問ごとにグループ化
      const questionsMap = new Map();

      for (const row of questions) {
        if (!questionsMap.has(row.question_id)) {
          questionsMap.set(row.question_id, {
            id: row.question_id.toString(),
            quiz_set_id: row.quiz_set_id.toString(),
            question_text: row.question_text,
            choices: [],
            created_at: row.question_created_at.toISOString(),
            updated_at: row.question_updated_at.toISOString()
          });
        }

        if (row.choice_id) {
          questionsMap.get(row.question_id).choices.push({
            id: row.choice_id.toString(),
            question_id: row.question_id.toString(),
            choice_text: row.choice_text,
            is_correct: row.is_correct
          });
        }
      }

      const formattedQuestions = Array.from(questionsMap.values());

      return c.json(formattedQuestions, 200);
    } catch (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        message: 'Database error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
}

const storeCreateQuestionRoute = (app: OpenAPIHono) => {
  // POST /api/quiz-sets/{quizSetId}/questions ルート定義
  const createQuestionRoute = createRoute({
    method: 'post',
    path: '/api/quiz-sets/{quizSetId}/questions',
    request: {
      params: QuizSetIdParamsSchema,
      body: {
        content: { 'application/json': { schema: CreateQuestionSchema } }
      }
    },
    responses: {
      201: {
        content: { 'application/json': { schema: QuestionSchema } },
        description: '質問作成成功'
      },
      400: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'バリデーションエラー'
      },
      403: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アクセス権限がありません'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'クイズセットが見つからない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // POST /api/quiz-sets/{quizSetId}/questions エンドポイント実装
  app.openapi(createQuestionRoute, async (c) => {
    const { quizSetId } = c.req.valid('param');
    const questionData = c.req.valid('json');
    const user = (c as any).get('user');

    try {
      // クイズセットの存在確認と権限チェック
      const quizSet = await db
        .selectFrom('quiz_sets')
        .select(['author_id'])
        .where('id', '=', parseInt(quizSetId))
        .executeTakeFirst();

      if (!quizSet) {
        return c.json({
          success: false,
          message: 'Quiz set not found'
        }, 404);
      }

      if (quizSet.author_id !== user.id) {
        return c.json({
          success: false,
          message: 'Access denied'
        }, 403);
      }

      // トランザクションで質問と選択肢を作成
      const result = await db.transaction().execute(async (trx) => {
        // 質問を作成
        const newQuestion = await trx
          .insertInto('questions')
          .values({
            quiz_set_id: parseInt(quizSetId),
            question_text: questionData.question_text
          })
          .returning(['id', 'quiz_set_id', 'question_text', 'created_at', 'updated_at'])
          .executeTakeFirstOrThrow();

        // 選択肢を作成
        const choices = await trx
          .insertInto('choices')
          .values(
            questionData.choices.map(choice => ({
              question_id: newQuestion.id,
              choice_text: choice.choice_text,
              is_correct: choice.is_correct
            }))
          )
          .returning(['id', 'question_id', 'choice_text', 'is_correct'])
          .execute();

        return {
          question: newQuestion,
          choices: choices
        };
      });

      return c.json({
        id: result.question.id.toString(),
        quiz_set_id: result.question.quiz_set_id.toString(),
        question_text: result.question.question_text,
        choices: result.choices.map(choice => ({
          id: choice.id.toString(),
          question_id: choice.question_id.toString(),
          choice_text: choice.choice_text,
          is_correct: choice.is_correct
        })),
        created_at: result.question.created_at.toISOString(),
        updated_at: result.question.updated_at.toISOString()
      }, 201);
    } catch (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        message: 'Database error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
}

const storeUpdateQuestionRoute = (app: OpenAPIHono) => {
  // PATCH /api/questions/{id} ルート定義
  const updateQuestionRoute = createRoute({
    method: 'patch',
    path: '/api/questions/{id}',
    request: {
      params: QuestionParamsSchema,
      body: {
        content: { 'application/json': { schema: UpdateQuestionSchema } }
      }
    },
    responses: {
      200: {
        content: { 'application/json': { schema: QuestionSchema } },
        description: '質問更新成功'
      },
      400: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'バリデーションエラー'
      },
      403: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アクセス権限がありません'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '質問が見つからない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // PATCH /api/questions/{id} エンドポイント実装
  app.openapi(updateQuestionRoute, async (c) => {
    const { id } = c.req.valid('param');
    const updateData = c.req.valid('json');
    const user = (c as any).get('user');

    try {
      // 質問の存在確認と権限チェック
      const questionWithQuizSet = await db
        .selectFrom('questions')
        .leftJoin('quiz_sets', 'quiz_sets.id', 'questions.quiz_set_id')
        .select(['questions.id', 'quiz_sets.author_id'])
        .where('questions.id', '=', parseInt(id))
        .executeTakeFirst();

      if (!questionWithQuizSet) {
        return c.json({
          success: false,
          message: 'Question not found'
        }, 404);
      }

      if (questionWithQuizSet.author_id !== user.id) {
        return c.json({
          success: false,
          message: 'Access denied'
        }, 403);
      }

      // トランザクションで質問と選択肢を更新
      const result = await db.transaction().execute(async (trx) => {
        // 質問を更新
        let updatedQuestion;
        if (updateData.question_text) {
          updatedQuestion = await trx
            .updateTable('questions')
            .set({
              question_text: updateData.question_text,
              updated_at: new Date()
            })
            .where('id', '=', parseInt(id))
            .returning(['id', 'quiz_set_id', 'question_text', 'created_at', 'updated_at'])
            .executeTakeFirst();
        } else {
          updatedQuestion = await trx
            .selectFrom('questions')
            .select(['id', 'quiz_set_id', 'question_text', 'created_at', 'updated_at'])
            .where('id', '=', parseInt(id))
            .executeTakeFirst();
        }

        // 選択肢を更新（指定されている場合）
        let choices;
        if (updateData.choices) {
          // 既存の選択肢を削除
          await trx
            .deleteFrom('choices')
            .where('question_id', '=', parseInt(id))
            .execute();

          // 新しい選択肢を作成
          choices = await trx
            .insertInto('choices')
            .values(
              updateData.choices.map(choice => ({
                question_id: parseInt(id),
                choice_text: choice.choice_text,
                is_correct: choice.is_correct
              }))
            )
            .returning(['id', 'question_id', 'choice_text', 'is_correct'])
            .execute();
        } else {
          // 既存の選択肢を取得
          choices = await trx
            .selectFrom('choices')
            .select(['id', 'question_id', 'choice_text', 'is_correct'])
            .where('question_id', '=', parseInt(id))
            .execute();
        }

        return {
          question: updatedQuestion,
          choices: choices
        };
      });

      if (!result.question) {
        return c.json({
          success: false,
          message: 'Question not found'
        }, 404);
      }

      return c.json({
        id: result.question.id.toString(),
        quiz_set_id: result.question.quiz_set_id.toString(),
        question_text: result.question.question_text,
        choices: result.choices.map(choice => ({
          id: choice.id.toString(),
          question_id: choice.question_id.toString(),
          choice_text: choice.choice_text,
          is_correct: choice.is_correct
        })),
        created_at: result.question.created_at.toISOString(),
        updated_at: result.question.updated_at.toISOString()
      }, 200);
    } catch (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        message: 'Database error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
}

const storeDeleteQuestionRoute = (app: OpenAPIHono) => {
  // DELETE /api/questions/{id} ルート定義
  const deleteQuestionRoute = createRoute({
    method: 'delete',
    path: '/api/questions/{id}',
    request: { params: QuestionParamsSchema },
    responses: {
      204: {
        description: '質問削除成功'
      },
      403: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アクセス権限がありません'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '質問が見つからない'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // DELETE /api/questions/{id} エンドポイント実装
  app.openapi(deleteQuestionRoute, async (c) => {
    const { id } = c.req.valid('param');
    const user = (c as any).get('user');

    try {
      // 質問の存在確認と権限チェック
      const questionWithQuizSet = await db
        .selectFrom('questions')
        .leftJoin('quiz_sets', 'quiz_sets.id', 'questions.quiz_set_id')
        .select(['questions.id', 'quiz_sets.author_id'])
        .where('questions.id', '=', parseInt(id))
        .executeTakeFirst();

      if (!questionWithQuizSet) {
        return c.json({
          success: false,
          message: 'Question not found'
        }, 404);
      }

      if (questionWithQuizSet.author_id !== user.id) {
        return c.json({
          success: false,
          message: 'Access denied'
        }, 403);
      }

      const result = await db
        .deleteFrom('questions')
        .where('id', '=', parseInt(id))
        .executeTakeFirst();

      if (result.numDeletedRows === 0n) {
        return c.json({
          success: false,
          message: 'Question not found'
        }, 404);
      }

      return c.body(null, 204);
    } catch (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        message: 'Database error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};