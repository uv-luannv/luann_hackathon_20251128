import { z } from '@hono/zod-openapi'

// メインチャレンジスキーマ
export const ChallengeSchema = z.object({
  id: z.string().openapi({ example: '1' }),
  user_id: z.string().openapi({ example: '1' }),
  quiz_set_id: z.string().openapi({ example: '1' }),
  score: z.number().int().min(0).openapi({ example: 8 }),
  is_first_attempt: z.boolean().openapi({ example: true }),
  created_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('Challenge')

// チャレンジ回答スキーマ
export const ChallengeAnswerSchema = z.object({
  question_id: z.string().openapi({ example: '1' }),
  choice_id: z.string().openapi({ example: '1' })
}).openapi('ChallengeAnswer')

// チャレンジ開始用質問スキーマ（正解を含まない）
export const ChallengeQuestionSchema = z.object({
  id: z.string().openapi({ example: '1' }),
  question_text: z.string().openapi({ example: 'JavaScriptでの変数宣言に使用されるキーワードは？' }),
  choices: z.array(z.object({
    id: z.string().openapi({ example: '1' }),
    choice_text: z.string().openapi({ example: 'var' })
  })).openapi({ example: [
    { id: '1', choice_text: 'var' },
    { id: '2', choice_text: 'let' },
    { id: '3', choice_text: 'const' },
    { id: '4', choice_text: 'function' }
  ]})
}).openapi('ChallengeQuestion')

// チャレンジ送信用スキーマ
export const SubmitChallengeSchema = z.object({
  answers: z.array(ChallengeAnswerSchema).min(1, '最低1つの回答が必要です').openapi({
    example: [
      { question_id: '1', choice_id: '2' },
      { question_id: '2', choice_id: '1' }
    ]
  })
}).openapi('SubmitChallenge')

// チャレンジ結果質問スキーマ（正解を含む）
export const ChallengeResultQuestionSchema = z.object({
  id: z.string().openapi({ example: '1' }),
  question_text: z.string().openapi({ example: 'JavaScriptでの変数宣言に使用されるキーワードは？' }),
  user_choice_id: z.string().nullable().openapi({ example: '2' }),
  correct_choice_id: z.string().openapi({ example: '2' }),
  is_correct: z.boolean().openapi({ example: true }),
  choices: z.array(z.object({
    id: z.string().openapi({ example: '1' }),
    choice_text: z.string().openapi({ example: 'var' }),
    is_correct: z.boolean().openapi({ example: false })
  })).openapi({ example: [
    { id: '1', choice_text: 'var', is_correct: false },
    { id: '2', choice_text: 'let', is_correct: true },
    { id: '3', choice_text: 'const', is_correct: false },
    { id: '4', choice_text: 'function', is_correct: false }
  ]})
}).openapi('ChallengeResultQuestion')

// チャレンジ結果スキーマ
export const ChallengeResultSchema = z.object({
  challenge: ChallengeSchema,
  total_questions: z.number().int().min(0).openapi({ example: 10 }),
  correct_answers: z.number().int().min(0).openapi({ example: 8 }),
  score_percentage: z.number().min(0).max(100).openapi({ example: 80 }),
  questions: z.array(ChallengeResultQuestionSchema)
}).openapi('ChallengeResult')

// ランキングエントリスキーマ
export const RankingEntrySchema = z.object({
  user_id: z.string().openapi({ example: '1' }),
  username: z.string().openapi({ example: 'user123' }),
  score: z.number().int().min(0).openapi({ example: 8 }),
  total_questions: z.number().int().min(0).openapi({ example: 10 }),
  score_percentage: z.number().min(0).max(100).openapi({ example: 80 }),
  created_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('RankingEntry')

// ランキングスキーマ
export const RankingSchema = z.object({
  quiz_set_id: z.string().openapi({ example: '1' }),
  quiz_set_title: z.string().openapi({ example: 'JavaScript基礎クイズ' }),
  rankings: z.array(RankingEntrySchema).max(10)
}).openapi('Ranking')

// パスパラメータ用スキーマ
export const ChallengeParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'IDは数値である必要があります').openapi({
    param: { name: 'id', in: 'path' },
    example: '1'
  })
})

// チャレンジ開始レスポンススキーマ
export const StartChallengeSchema = z.object({
  quiz_set_id: z.string().openapi({ example: '1' }),
  quiz_set_title: z.string().openapi({ example: 'JavaScript基礎クイズ' }),
  questions: z.array(ChallengeQuestionSchema)
}).openapi('StartChallenge')

// スコア履歴スキーマ
export const ScoreHistorySchema = z.array(z.object({
  challenge: ChallengeSchema,
  quiz_set_title: z.string().openapi({ example: 'JavaScript基礎クイズ' }),
  total_questions: z.number().int().min(0).openapi({ example: 10 }),
  score_percentage: z.number().min(0).max(100).openapi({ example: 80 })
})).openapi('ScoreHistory')