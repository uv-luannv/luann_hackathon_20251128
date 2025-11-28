import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { authMiddleware } from '../middleware/auth.js';
import { 
  QuizSetListSchema, 
  QuizSetParamsSchema, 
  QuizSetSchema, 
  CreateQuizSetSchema, 
  UpdateQuizSetSchema,
  TogglePublishSchema,
  QuizSetQuerySchema
} from '../schemas/quiz_sets.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { db } from '../db/connection.js';

export const storeQuizSetApi = (app: OpenAPIHono) => {
  app.use('/api/quiz-sets/*', authMiddleware);
  storeGetQuizSetsRoute(app);
  storeGetQuizSetRoute(app);
  storeCreateQuizSetRoute(app);
  storeUpdateQuizSetRoute(app);
  storeTogglePublishRoute(app);
  storeDeleteQuizSetRoute(app);
};

const storeGetQuizSetsRoute = (app: OpenAPIHono) => {
  // GET /api/quiz-sets ルート定義
  const getQuizSetsRoute = createRoute({
    method: 'get',
    path: '/api/quiz-sets',
    request: { 
      query: QuizSetQuerySchema 
    },
    responses: {
      200: {
        content: { 'application/json': { schema: QuizSetListSchema } },
        description: 'クイズセット一覧を取得'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/quiz-sets エンドポイント実装
  app.openapi(getQuizSetsRoute, async (c) => {
    const query = c.req.valid('query');
    const user = (c as any).get('user');

    try {
      let dbQuery = db
        .selectFrom('quiz_sets')
        .leftJoin('ratings', 'ratings.quiz_set_id', 'quiz_sets.id')
        .select([
          'quiz_sets.id',
          'quiz_sets.title', 
          'quiz_sets.description', 
          'quiz_sets.category', 
          'quiz_sets.is_public', 
          'quiz_sets.author_id', 
          'quiz_sets.created_at', 
          'quiz_sets.updated_at',
          (eb) => eb.fn.avg('ratings.rating').as('average_rating'),
          (eb) => eb.fn.count('ratings.id').as('rating_count')
        ])
        .groupBy(['quiz_sets.id', 'quiz_sets.title', 'quiz_sets.description', 'quiz_sets.category', 'quiz_sets.is_public', 'quiz_sets.author_id', 'quiz_sets.created_at', 'quiz_sets.updated_at']);

      // 公開クイズまたは自分が作成したクイズのみを表示
      dbQuery = dbQuery.where((eb) => 
        eb.or([
          eb('quiz_sets.is_public', '=', true),
          eb('quiz_sets.author_id', '=', user.id)
        ])
      );

      // カテゴリフィルタ
      if (query.category) {
        dbQuery = dbQuery.where('quiz_sets.category', '=', query.category);
      }

      // 作成者フィルタ
      if (query.author_id) {
        dbQuery = dbQuery.where('quiz_sets.author_id', '=', parseInt(query.author_id));
      }

      const quizSets = await dbQuery
        .orderBy('quiz_sets.created_at', 'desc')
        .execute();

      const formattedQuizSets = quizSets.map(quizSet => ({
        id: quizSet.id.toString(),
        title: quizSet.title,
        description: quizSet.description,
        category: quizSet.category,
        is_public: quizSet.is_public,
        author_id: quizSet.author_id.toString(),
        average_rating: quizSet.average_rating ? Number(Number(quizSet.average_rating).toFixed(1)) : null,
        rating_count: Number(quizSet.rating_count),
        created_at: quizSet.created_at.toISOString(),
        updated_at: quizSet.updated_at.toISOString()
      }));

      return c.json(formattedQuizSets, 200);
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

const storeGetQuizSetRoute = (app: OpenAPIHono) => {
  // GET /api/quiz-sets/{id} ルート定義
  const getQuizSetRoute = createRoute({
    method: 'get',
    path: '/api/quiz-sets/{id}',
    request: { params: QuizSetParamsSchema },
    responses: {
      200: {
        content: { 'application/json': { schema: QuizSetSchema } },
        description: 'クイズセット詳細を取得'
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

  // GET /api/quiz-sets/{id} エンドポイント実装
  app.openapi(getQuizSetRoute, async (c) => {
    const { id } = c.req.valid('param');
    const user = (c as any).get('user');

    try {
      const quizSetResult = await db
        .selectFrom('quiz_sets')
        .leftJoin('ratings', 'ratings.quiz_set_id', 'quiz_sets.id')
        .select([
          'quiz_sets.id', 
          'quiz_sets.title', 
          'quiz_sets.description', 
          'quiz_sets.category', 
          'quiz_sets.is_public', 
          'quiz_sets.author_id', 
          'quiz_sets.created_at', 
          'quiz_sets.updated_at',
          (eb) => eb.fn.avg('ratings.rating').as('average_rating'),
          (eb) => eb.fn.count('ratings.id').as('rating_count')
        ])
        .where('quiz_sets.id', '=', parseInt(id))
        .groupBy(['quiz_sets.id', 'quiz_sets.title', 'quiz_sets.description', 'quiz_sets.category', 'quiz_sets.is_public', 'quiz_sets.author_id', 'quiz_sets.created_at', 'quiz_sets.updated_at'])
        .executeTakeFirst();

      if (!quizSetResult) {
        return c.json({
          success: false,
          message: 'Quiz set not found'
        }, 404);
      }

      // アクセス権限チェック（公開されているか自分が作成者）
      if (!quizSetResult.is_public && quizSetResult.author_id !== user.id) {
        return c.json({
          success: false,
          message: 'Access denied'
        }, 403);
      }

      return c.json({
        id: quizSetResult.id.toString(),
        title: quizSetResult.title,
        description: quizSetResult.description,
        category: quizSetResult.category,
        is_public: quizSetResult.is_public,
        author_id: quizSetResult.author_id.toString(),
        average_rating: quizSetResult.average_rating ? Number(Number(quizSetResult.average_rating).toFixed(1)) : null,
        rating_count: Number(quizSetResult.rating_count),
        created_at: quizSetResult.created_at.toISOString(),
        updated_at: quizSetResult.updated_at.toISOString()
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

const storeCreateQuizSetRoute = (app: OpenAPIHono) => {
  // POST /api/quiz-sets ルート定義
  const createQuizSetRoute = createRoute({
    method: 'post',
    path: '/api/quiz-sets',
    request: {
      body: {
        content: { 'application/json': { schema: CreateQuizSetSchema } }
      }
    },
    responses: {
      201: {
        content: { 'application/json': { schema: QuizSetSchema } },
        description: 'クイズセット作成成功'
      },
      400: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'バリデーションエラー'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // POST /api/quiz-sets エンドポイント実装
  app.openapi(createQuizSetRoute, async (c) => {
    const quizSetData = c.req.valid('json');
    const user = (c as any).get('user');

    try {
      const newQuizSet = await db
        .insertInto('quiz_sets')
        .values({
          title: quizSetData.title,
          description: quizSetData.description || null,
          category: quizSetData.category || null,
          author_id: user.id,
          is_public: false // 新規作成時は非公開
        })
        .returning(['id', 'title', 'description', 'category', 'is_public', 'author_id', 'created_at', 'updated_at'])
        .executeTakeFirstOrThrow();

      return c.json({
        id: newQuizSet.id.toString(),
        title: newQuizSet.title,
        description: newQuizSet.description,
        category: newQuizSet.category,
        is_public: newQuizSet.is_public,
        author_id: newQuizSet.author_id.toString(),
        average_rating: null,
        rating_count: 0,
        created_at: newQuizSet.created_at.toISOString(),
        updated_at: newQuizSet.updated_at.toISOString()
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

const storeUpdateQuizSetRoute = (app: OpenAPIHono) => {
  // PATCH /api/quiz-sets/{id} ルート定義
  const updateQuizSetRoute = createRoute({
    method: 'patch',
    path: '/api/quiz-sets/{id}',
    request: {
      params: QuizSetParamsSchema,
      body: {
        content: { 'application/json': { schema: UpdateQuizSetSchema } }
      }
    },
    responses: {
      200: {
        content: { 'application/json': { schema: QuizSetSchema } },
        description: 'クイズセット更新成功'
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

  // PATCH /api/quiz-sets/{id} エンドポイント実装
  app.openapi(updateQuizSetRoute, async (c) => {
    const { id } = c.req.valid('param');
    const updateData = c.req.valid('json');
    const user = (c as any).get('user');

    try {
      // 権限チェック
      const quizSet = await db
        .selectFrom('quiz_sets')
        .select(['author_id'])
        .where('id', '=', parseInt(id))
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

      const updatedQuizSet = await db
        .updateTable('quiz_sets')
        .set({
          ...updateData,
          updated_at: new Date()
        })
        .where('id', '=', parseInt(id))
        .returning(['id', 'title', 'description', 'category', 'is_public', 'author_id', 'created_at', 'updated_at'])
        .executeTakeFirst();

      if (!updatedQuizSet) {
        return c.json({
          success: false,
          message: 'Quiz set not found'
        }, 404);
      }

      return c.json({
        id: updatedQuizSet.id.toString(),
        title: updatedQuizSet.title,
        description: updatedQuizSet.description,
        category: updatedQuizSet.category,
        is_public: updatedQuizSet.is_public,
        author_id: updatedQuizSet.author_id.toString(),
        average_rating: null,
        rating_count: 0,
        created_at: updatedQuizSet.created_at.toISOString(),
        updated_at: updatedQuizSet.updated_at.toISOString()
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

const storeTogglePublishRoute = (app: OpenAPIHono) => {
  // PATCH /api/quiz-sets/{id}/publish ルート定義
  const togglePublishRoute = createRoute({
    method: 'patch',
    path: '/api/quiz-sets/{id}/publish',
    request: {
      params: QuizSetParamsSchema,
      body: {
        content: { 'application/json': { schema: TogglePublishSchema } }
      }
    },
    responses: {
      200: {
        content: { 'application/json': { schema: QuizSetSchema } },
        description: '公開状態切り替え成功'
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

  // PATCH /api/quiz-sets/{id}/publish エンドポイント実装
  app.openapi(togglePublishRoute, async (c) => {
    const { id } = c.req.valid('param');
    const { is_public } = c.req.valid('json');
    const user = (c as any).get('user');

    try {
      // 権限チェック
      const quizSet = await db
        .selectFrom('quiz_sets')
        .select(['author_id'])
        .where('id', '=', parseInt(id))
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

      const updatedQuizSet = await db
        .updateTable('quiz_sets')
        .set({
          is_public,
          updated_at: new Date()
        })
        .where('id', '=', parseInt(id))
        .returning(['id', 'title', 'description', 'category', 'is_public', 'author_id', 'created_at', 'updated_at'])
        .executeTakeFirst();

      if (!updatedQuizSet) {
        return c.json({
          success: false,
          message: 'Quiz set not found'
        }, 404);
      }

      return c.json({
        id: updatedQuizSet.id.toString(),
        title: updatedQuizSet.title,
        description: updatedQuizSet.description,
        category: updatedQuizSet.category,
        is_public: updatedQuizSet.is_public,
        author_id: updatedQuizSet.author_id.toString(),
        average_rating: null,
        rating_count: 0,
        created_at: updatedQuizSet.created_at.toISOString(),
        updated_at: updatedQuizSet.updated_at.toISOString()
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

const storeDeleteQuizSetRoute = (app: OpenAPIHono) => {
  // DELETE /api/quiz-sets/{id} ルート定義
  const deleteQuizSetRoute = createRoute({
    method: 'delete',
    path: '/api/quiz-sets/{id}',
    request: { params: QuizSetParamsSchema },
    responses: {
      204: {
        description: 'クイズセット削除成功'
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

  // DELETE /api/quiz-sets/{id} エンドポイント実装
  app.openapi(deleteQuizSetRoute, async (c) => {
    const { id } = c.req.valid('param');
    const user = (c as any).get('user');

    try {
      // 権限チェック
      const quizSet = await db
        .selectFrom('quiz_sets')
        .select(['author_id'])
        .where('id', '=', parseInt(id))
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

      const result = await db
        .deleteFrom('quiz_sets')
        .where('id', '=', parseInt(id))
        .executeTakeFirst();

      if (result.numDeletedRows === 0n) {
        return c.json({
          success: false,
          message: 'Quiz set not found'
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