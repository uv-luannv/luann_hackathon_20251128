import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { authMiddleware } from '../middleware/auth.js';
import { 
  CreateRatingSchema, 
  RatingParamsSchema,
  RatingResponseSchema
} from '../schemas/ratings.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { db } from '../db/connection.js';

export const storeRatingApi = (app: OpenAPIHono) => {
  app.use('/api/quiz-sets/*/rate', authMiddleware);
  storeCreateRatingRoute(app);
};

const storeCreateRatingRoute = (app: OpenAPIHono) => {
  // POST /api/quiz-sets/{id}/rate ルート定義
  const createRatingRoute = createRoute({
    method: 'post',
    path: '/api/quiz-sets/{id}/rate',
    request: { 
      params: RatingParamsSchema,
      body: {
        content: { 'application/json': { schema: CreateRatingSchema } }
      }
    },
    responses: {
      200: {
        content: { 'application/json': { schema: RatingResponseSchema } },
        description: 'レーティングが正常に作成または更新されました'
      },
      400: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'バリデーションエラー'
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

  // POST /api/quiz-sets/{id}/rate エンドポイント実装
  app.openapi(createRatingRoute, async (c) => {
    const { id } = c.req.valid('param');
    const { rating } = c.req.valid('json');
    const user = (c as any).get('user');

    try {
      // クイズセットの存在確認
      const quizSet = await db
        .selectFrom('quiz_sets')
        .select(['id', 'is_public', 'author_id'])
        .where('id', '=', parseInt(id))
        .executeTakeFirst();

      if (!quizSet) {
        return c.json({
          success: false,
          message: 'クイズセットが見つかりません'
        }, 404);
      }

      // 自分が作成したクイズセットには評価できない
      if (quizSet.author_id === user.id) {
        return c.json({
          success: false,
          message: '自分が作成したクイズセットには評価できません'
        }, 400);
      }

      // 既存のレーティングをチェック
      const existingRating = await db
        .selectFrom('ratings')
        .select(['id', 'rating'])
        .where('user_id', '=', user.id)
        .where('quiz_set_id', '=', parseInt(id))
        .executeTakeFirst();

      let ratingResult;

      if (existingRating) {
        // 既存レーティングを更新
        ratingResult = await db
          .updateTable('ratings')
          .set({
            rating,
            updated_at: new Date()
          })
          .where('id', '=', existingRating.id)
          .returningAll()
          .executeTakeFirst();
      } else {
        // 新しいレーティングを作成
        ratingResult = await db
          .insertInto('ratings')
          .values({
            user_id: user.id,
            quiz_set_id: parseInt(id),
            rating,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returningAll()
          .executeTakeFirst();
      }

      if (!ratingResult) {
        return c.json({
          success: false,
          message: 'レーティングの保存に失敗しました'
        }, 500);
      }

      const formattedRating = {
        id: ratingResult.id.toString(),
        user_id: ratingResult.user_id.toString(),
        quiz_set_id: ratingResult.quiz_set_id.toString(),
        rating: ratingResult.rating,
        created_at: ratingResult.created_at.toISOString(),
        updated_at: ratingResult.updated_at.toISOString()
      };

      return c.json({
        success: true,
        message: existingRating ? 'レーティングが正常に更新されました' : 'レーティングが正常に保存されました',
        data: formattedRating
      }, 200);

    } catch (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        message: 'データベースエラーが発生しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
};