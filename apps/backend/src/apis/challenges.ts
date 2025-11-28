import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { authMiddleware } from '../middleware/auth.js';
import {
  ChallengeParamsSchema,
  StartChallengeSchema,
  SubmitChallengeSchema,
  ChallengeResultSchema,
  RankingSchema,
  ScoreHistorySchema
} from '../schemas/challenges.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { db } from '../db/connection.js';

export const storeChallengeApi = (app: OpenAPIHono) => {
  app.use('/api/quiz-sets/*/challenge/*', authMiddleware);
  app.use('/api/challenges/*', authMiddleware);
  app.use('/api/my-scores', authMiddleware);
  
  storeStartChallengeRoute(app);
  storeSubmitChallengeRoute(app);
  storeGetChallengeResultRoute(app);
  storeGetRankingRoute(app);
  storeGetMyScoresRoute(app);
};

const storeStartChallengeRoute = (app: OpenAPIHono) => {
  // GET /api/quiz-sets/{id}/challenge/start ルート定義
  const startChallengeRoute = createRoute({
    method: 'get',
    path: '/api/quiz-sets/{id}/challenge/start',
    request: { 
      params: ChallengeParamsSchema 
    },
    responses: {
      200: {
        content: { 'application/json': { schema: StartChallengeSchema } },
        description: 'チャレンジを開始（質問一覧を取得）'
      },
      400: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'クイズセットに質問が登録されていません'
      },
      403: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アクセス権限がありません'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'クイズセットが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/quiz-sets/{id}/challenge/start エンドポイント実装
  app.openapi(startChallengeRoute, async (c) => {
    const { id } = c.req.valid('param');
    const quizSetId = parseInt(id);

    try {
      // クイズセットの存在確認と公開状態チェック
      const quizSet = await db
        .selectFrom('quiz_sets')
        .select(['id', 'title', 'is_public', 'author_id'])
        .where('id', '=', quizSetId)
        .executeTakeFirst();

      if (!quizSet) {
        return c.json({
          success: false,
          message: 'クイズセットが見つかりません'
        }, 404);
      }

      const user = (c as any).get('user');
      
      // 公開されているか、作成者本人かチェック
      if (!quizSet.is_public && quizSet.author_id !== user.id) {
        return c.json({
          success: false,
          message: 'このクイズセットにアクセスする権限がありません'
        }, 403);
      }

      // 質問と選択肢を取得（正解情報は除外）
      const questionsWithChoices = await db
        .selectFrom('questions')
        .leftJoin('choices', 'questions.id', 'choices.question_id')
        .select([
          'questions.id as question_id',
          'questions.question_text',
          'choices.id as choice_id',
          'choices.choice_text'
        ])
        .where('questions.quiz_set_id', '=', quizSetId)
        .orderBy('questions.id')
        .orderBy('choices.id')
        .execute();

      // 質問ごとにグループ化
      const questionsMap = new Map();
      
      for (const row of questionsWithChoices) {
        if (!questionsMap.has(row.question_id)) {
          questionsMap.set(row.question_id, {
            id: row.question_id.toString(),
            question_text: row.question_text,
            choices: []
          });
        }
        
        if (row.choice_id) {
          questionsMap.get(row.question_id).choices.push({
            id: row.choice_id.toString(),
            choice_text: row.choice_text
          });
        }
      }

      const questions = Array.from(questionsMap.values());

      if (questions.length === 0) {
        return c.json({
          success: false,
          message: 'このクイズセットには質問が登録されていません'
        }, 400);
      }

      return c.json({
        quiz_set_id: quizSet.id.toString(),
        quiz_set_title: quizSet.title,
        questions
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

const storeSubmitChallengeRoute = (app: OpenAPIHono) => {
  // POST /api/quiz-sets/{id}/challenge/submit ルート定義
  const submitChallengeRoute = createRoute({
    method: 'post',
    path: '/api/quiz-sets/{id}/challenge/submit',
    request: {
      params: ChallengeParamsSchema,
      body: {
        content: { 'application/json': { schema: SubmitChallengeSchema } },
        description: 'チャレンジ回答の送信'
      }
    },
    responses: {
      200: {
        content: { 'application/json': { schema: ChallengeResultSchema } },
        description: 'チャレンジ結果'
      },
      400: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: '無効な回答データ'
      },
      403: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アクセス権限がありません'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'クイズセットが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // POST /api/quiz-sets/{id}/challenge/submit エンドポイント実装
  app.openapi(submitChallengeRoute, async (c) => {
    const { id } = c.req.valid('param');
    const { answers } = c.req.valid('json');
    const quizSetId = parseInt(id);
    const user = (c as any).get('user');

    try {
      // クイズセットの存在確認
      const quizSet = await db
        .selectFrom('quiz_sets')
        .select(['id', 'title', 'is_public', 'author_id'])
        .where('id', '=', quizSetId)
        .executeTakeFirst();

      if (!quizSet) {
        return c.json({
          success: false,
          message: 'クイズセットが見つかりません'
        }, 404);
      }

      // アクセス権限チェック
      if (!quizSet.is_public && quizSet.author_id !== user.id) {
        return c.json({
          success: false,
          message: 'このクイズセットにアクセスする権限がありません'
        }, 403);
      }

      // 質問と正解を取得
      const questionsWithCorrectAnswers = await db
        .selectFrom('questions')
        .leftJoin('choices', 'questions.id', 'choices.question_id')
        .select([
          'questions.id as question_id',
          'questions.question_text',
          'choices.id as choice_id',
          'choices.choice_text',
          'choices.is_correct'
        ])
        .where('questions.quiz_set_id', '=', quizSetId)
        .orderBy('questions.id')
        .execute();

      // 質問ごとに整理
      const questionsMap = new Map();
      const correctAnswersMap = new Map(); // question_id -> correct_choice_id

      for (const row of questionsWithCorrectAnswers) {
        if (!questionsMap.has(row.question_id)) {
          questionsMap.set(row.question_id, {
            id: row.question_id.toString(),
            question_text: row.question_text,
            choices: []
          });
        }
        
        if (row.choice_id) {
          questionsMap.get(row.question_id).choices.push({
            id: row.choice_id.toString(),
            choice_text: row.choice_text,
            is_correct: row.is_correct
          });

          if (row.is_correct) {
            correctAnswersMap.set(row.question_id, row.choice_id);
          }
        }
      }

      // スコアを計算
      let correctCount = 0;
      const totalQuestions = questionsMap.size;

      for (const answer of answers) {
        const questionId = parseInt(answer.question_id);
        const choiceId = parseInt(answer.choice_id);
        const correctChoiceId = correctAnswersMap.get(questionId);
        
        if (correctChoiceId === choiceId) {
          correctCount++;
        }
      }

      // 初回挑戦かどうかを確認
      const existingChallenge = await db
        .selectFrom('challenges')
        .select(['id'])
        .where('user_id', '=', user.id)
        .where('quiz_set_id', '=', quizSetId)
        .executeTakeFirst();

      const isFirstAttempt = !existingChallenge;

      // チャレンジ記録を保存
      const challenge = await db
        .insertInto('challenges')
        .values({
          user_id: user.id,
          quiz_set_id: quizSetId,
          score: correctCount,
          is_first_attempt: isFirstAttempt,
          created_at: new Date()
        })
        .returningAll()
        .executeTakeFirst();

      if (!challenge) {
        throw new Error('チャレンジの保存に失敗しました');
      }

      // 回答記録を保存
      for (const answer of answers) {
        await db
          .insertInto('challenge_answers')
          .values({
            challenge_id: challenge.id,
            question_id: parseInt(answer.question_id),
            choice_id: parseInt(answer.choice_id)
          })
          .execute();
      }

      // 結果用の質問データを作成
      const userAnswersMap = new Map();
      for (const answer of answers) {
        userAnswersMap.set(parseInt(answer.question_id), parseInt(answer.choice_id));
      }

      const resultQuestions = Array.from(questionsMap.values()).map(question => {
        const questionId = parseInt(question.id);
        const userChoiceId = userAnswersMap.get(questionId);
        const correctChoiceId = correctAnswersMap.get(questionId);
        
        return {
          ...question,
          user_choice_id: userChoiceId ? userChoiceId.toString() : null,
          correct_choice_id: correctChoiceId ? correctChoiceId.toString() : null,
          is_correct: userChoiceId === correctChoiceId
        };
      });

      return c.json({
        challenge: {
          id: challenge.id.toString(),
          user_id: challenge.user_id.toString(),
          quiz_set_id: challenge.quiz_set_id.toString(),
          score: challenge.score,
          is_first_attempt: challenge.is_first_attempt,
          created_at: challenge.created_at.toISOString()
        },
        total_questions: totalQuestions,
        correct_answers: correctCount,
        score_percentage: Math.round((correctCount / totalQuestions) * 100),
        questions: resultQuestions
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

const storeGetChallengeResultRoute = (app: OpenAPIHono) => {
  // GET /api/challenges/{id}/result ルート定義
  const getChallengeResultRoute = createRoute({
    method: 'get',
    path: '/api/challenges/{id}/result',
    request: { 
      params: ChallengeParamsSchema 
    },
    responses: {
      200: {
        content: { 'application/json': { schema: ChallengeResultSchema } },
        description: 'チャレンジ結果の取得'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'チャレンジが見つかりません'
      },
      403: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'アクセス権限がありません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/challenges/{id}/result エンドポイント実装
  app.openapi(getChallengeResultRoute, async (c) => {
    const { id } = c.req.valid('param');
    const challengeId = parseInt(id);
    const user = (c as any).get('user');

    try {
      // チャレンジの存在確認とアクセス権限チェック
      const challenge = await db
        .selectFrom('challenges')
        .select(['id', 'user_id', 'quiz_set_id', 'score', 'is_first_attempt', 'created_at'])
        .where('id', '=', challengeId)
        .where('user_id', '=', user.id)
        .executeTakeFirst();

      if (!challenge) {
        return c.json({
          success: false,
          message: 'チャレンジが見つからないか、アクセス権限がありません'
        }, 404);
      }

      // チャレンジの回答を取得
      const challengeAnswers = await db
        .selectFrom('challenge_answers')
        .select(['question_id', 'choice_id'])
        .where('challenge_id', '=', challengeId)
        .execute();

      const userAnswersMap = new Map();
      for (const answer of challengeAnswers) {
        userAnswersMap.set(answer.question_id, answer.choice_id);
      }

      // 質問と選択肢を取得
      const questionsWithChoices = await db
        .selectFrom('questions')
        .leftJoin('choices', 'questions.id', 'choices.question_id')
        .select([
          'questions.id as question_id',
          'questions.question_text',
          'choices.id as choice_id',
          'choices.choice_text',
          'choices.is_correct'
        ])
        .where('questions.quiz_set_id', '=', challenge.quiz_set_id)
        .orderBy('questions.id')
        .execute();

      // 質問ごとに整理
      const questionsMap = new Map();
      const correctAnswersMap = new Map();

      for (const row of questionsWithChoices) {
        if (!questionsMap.has(row.question_id)) {
          questionsMap.set(row.question_id, {
            id: row.question_id.toString(),
            question_text: row.question_text,
            choices: []
          });
        }
        
        if (row.choice_id) {
          questionsMap.get(row.question_id).choices.push({
            id: row.choice_id.toString(),
            choice_text: row.choice_text,
            is_correct: row.is_correct
          });

          if (row.is_correct) {
            correctAnswersMap.set(row.question_id, row.choice_id);
          }
        }
      }

      // 結果用の質問データを作成
      const resultQuestions = Array.from(questionsMap.values()).map(question => {
        const questionId = parseInt(question.id);
        const userChoiceId = userAnswersMap.get(questionId);
        const correctChoiceId = correctAnswersMap.get(questionId);
        
        return {
          ...question,
          user_choice_id: userChoiceId ? userChoiceId.toString() : null,
          correct_choice_id: correctChoiceId ? correctChoiceId.toString() : null,
          is_correct: userChoiceId === correctChoiceId
        };
      });

      const totalQuestions = questionsMap.size;

      return c.json({
        challenge: {
          id: challenge.id.toString(),
          user_id: challenge.user_id.toString(),
          quiz_set_id: challenge.quiz_set_id.toString(),
          score: challenge.score,
          is_first_attempt: challenge.is_first_attempt,
          created_at: challenge.created_at.toISOString()
        },
        total_questions: totalQuestions,
        correct_answers: challenge.score,
        score_percentage: Math.round((challenge.score / totalQuestions) * 100),
        questions: resultQuestions
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

const storeGetRankingRoute = (app: OpenAPIHono) => {
  // GET /api/quiz-sets/{id}/ranking ルート定義
  const getRankingRoute = createRoute({
    method: 'get',
    path: '/api/quiz-sets/{id}/ranking',
    request: { 
      params: ChallengeParamsSchema 
    },
    responses: {
      200: {
        content: { 'application/json': { schema: RankingSchema } },
        description: 'クイズセットランキングの取得（初回挑戦のみ）'
      },
      404: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'クイズセットが見つかりません'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/quiz-sets/{id}/ranking エンドポイント実装
  app.openapi(getRankingRoute, async (c) => {
    const { id } = c.req.valid('param');
    const quizSetId = parseInt(id);

    try {
      // クイズセットの存在確認
      const quizSet = await db
        .selectFrom('quiz_sets')
        .select(['id', 'title', 'is_public'])
        .where('id', '=', quizSetId)
        .where('is_public', '=', true)
        .executeTakeFirst();

      if (!quizSet) {
        return c.json({
          success: false,
          message: 'クイズセットが見つからないか、公開されていません'
        }, 404);
      }

      // クイズの総質問数を取得
      const totalQuestions = await db
        .selectFrom('questions')
        .select([db.fn.count('id').as('count')])
        .where('quiz_set_id', '=', quizSetId)
        .executeTakeFirst();

      const questionCount = Number(totalQuestions?.count || 0);

      if (questionCount === 0) {
        return c.json({
          quiz_set_id: quizSet.id.toString(),
          quiz_set_title: quizSet.title,
          rankings: []
        }, 200);
      }

      // 初回挑戦のトップ10を取得
      const rankings = await db
        .selectFrom('challenges')
        .leftJoin('users', 'challenges.user_id', 'users.id')
        .select([
          'challenges.user_id',
          'users.name',
          'challenges.score',
          'challenges.created_at'
        ])
        .where('challenges.quiz_set_id', '=', quizSetId)
        .where('challenges.is_first_attempt', '=', true)
        .orderBy('challenges.score', 'desc')
        .orderBy('challenges.created_at', 'asc')
        .limit(10)
        .execute();

      const formattedRankings = rankings.map(ranking => ({
        user_id: ranking.user_id.toString(),
        username: ranking.name || 'Unknown User',
        score: ranking.score,
        total_questions: questionCount,
        score_percentage: Math.round((ranking.score / questionCount) * 100),
        created_at: ranking.created_at?.toISOString() || new Date().toISOString()
      }));

      return c.json({
        quiz_set_id: quizSet.id.toString(),
        quiz_set_title: quizSet.title,
        rankings: formattedRankings
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

const storeGetMyScoresRoute = (app: OpenAPIHono) => {
  // GET /api/my-scores ルート定義
  const getMyScoresRoute = createRoute({
    method: 'get',
    path: '/api/my-scores',
    responses: {
      200: {
        content: { 'application/json': { schema: ScoreHistorySchema } },
        description: 'ユーザーのスコア履歴を取得'
      },
      500: {
        content: { 'application/json': { schema: ErrorResponseSchema } },
        description: 'データベースエラー'
      }
    }
  });

  // GET /api/my-scores エンドポイント実装
  app.openapi(getMyScoresRoute, async (c) => {
    const user = (c as any).get('user');

    try {
      // ユーザーのチャレンジ履歴を取得
      const challengesWithQuizSets = await db
        .selectFrom('challenges')
        .leftJoin('quiz_sets', 'challenges.quiz_set_id', 'quiz_sets.id')
        .select([
          'challenges.id',
          'challenges.user_id',
          'challenges.quiz_set_id',
          'challenges.score',
          'challenges.is_first_attempt',
          'challenges.created_at',
          'quiz_sets.title as quiz_set_title'
        ])
        .where('challenges.user_id', '=', user.id)
        .orderBy('challenges.created_at', 'desc')
        .execute();

      // 各チャレンジの総質問数を取得
      const scoreHistory = [];

      for (const challenge of challengesWithQuizSets) {
        const totalQuestions = await db
          .selectFrom('questions')
          .select([db.fn.count('id').as('count')])
          .where('quiz_set_id', '=', challenge.quiz_set_id)
          .executeTakeFirst();

        const questionCount = Number(totalQuestions?.count || 0);
        const scorePercentage = questionCount > 0 ? Math.round((challenge.score / questionCount) * 100) : 0;

        scoreHistory.push({
          challenge: {
            id: challenge.id.toString(),
            user_id: challenge.user_id.toString(),
            quiz_set_id: challenge.quiz_set_id.toString(),
            score: challenge.score,
            is_first_attempt: challenge.is_first_attempt,
            created_at: challenge.created_at.toISOString()
          },
          quiz_set_title: challenge.quiz_set_title || 'Unknown Quiz',
          total_questions: questionCount,
          score_percentage: scorePercentage
        });
      }

      return c.json(scoreHistory, 200);

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