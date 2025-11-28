import { z } from '@hono/zod-openapi'

// 選択肢スキーマ
export const ChoiceSchema = z.object({
  id: z.string().openapi({ example: '1' }),
  question_id: z.string().openapi({ example: '1' }),
  choice_text: z.string().openapi({ example: 'let' }),
  is_correct: z.boolean().openapi({ example: true })
}).openapi('Choice')

// 質問スキーマ
export const QuestionSchema = z.object({
  id: z.string().openapi({ example: '1' }),
  quiz_set_id: z.string().openapi({ example: '1' }),
  question_text: z.string().openapi({ example: 'JavaScriptで変数を宣言するキーワードは？' }),
  choices: z.array(ChoiceSchema).optional(),
  created_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' }),
  updated_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('Question')

// 選択肢作成用スキーマ
export const CreateChoiceSchema = z.object({
  choice_text: z.string().min(1, '選択肢は必須です').max(255, '選択肢は255文字以内で入力してください').openapi({ example: 'const' }),
  is_correct: z.boolean().openapi({ example: false })
}).openapi('CreateChoice')

// 質問作成用スキーマ（4つの選択肢を含む）
export const CreateQuestionSchema = z.object({
  question_text: z.string().min(1, '質問は必須です').openapi({ example: 'JavaScriptでブロックスコープの変数を宣言するキーワードは？' }),
  choices: z.array(CreateChoiceSchema).length(4, '選択肢は必ず4つ必要です').refine((choices: Array<{ choice_text: string, is_correct: boolean }>) => {
    const correctChoices = choices.filter((choice: { choice_text: string, is_correct: boolean }) => choice.is_correct)
    return correctChoices.length === 1
  }, {
    message: '正解の選択肢は必ず1つ必要です'
  }).openapi({ example: [
    { choice_text: 'var', is_correct: false },
    { choice_text: 'let', is_correct: true },
    { choice_text: 'const', is_correct: false },
    { choice_text: 'function', is_correct: false }
  ]})
}).openapi('CreateQuestion')

// 質問更新用スキーマ
export const UpdateQuestionSchema = z.object({
  question_text: z.string().min(1, '質問は必須です').optional().openapi({ example: 'ES6で導入された変数宣言キーワードは？' }),
  choices: z.array(CreateChoiceSchema).length(4, '選択肢は必ず4つ必要です').refine((choices: Array<{ choice_text: string, is_correct: boolean }>) => {
    const correctChoices = choices.filter((choice: { choice_text: string, is_correct: boolean }) => choice.is_correct)
    return correctChoices.length === 1
  }, {
    message: '正解の選択肢は必ず1つ必要です'
  }).optional()
}).openapi('UpdateQuestion')

// パスパラメータ用スキーマ
export const QuestionParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'IDは数値である必要があります').openapi({
    param: { name: 'id', in: 'path' },
    example: '1'
  })
})

export const QuizSetIdParamsSchema = z.object({
  quizSetId: z.string().regex(/^\d+$/, 'IDは数値である必要があります').openapi({
    param: { name: 'quizSetId', in: 'path' },
    example: '1'
  })
})

// 質問リスト用スキーマ
export const QuestionListSchema = z.array(QuestionSchema).openapi('QuestionList')