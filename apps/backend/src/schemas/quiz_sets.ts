import { z } from '@hono/zod-openapi'

// メインクイズセットスキーマ
export const QuizSetSchema = z.object({
  id: z.string().openapi({ example: '1' }),
  title: z.string().openapi({ example: 'JavaScript基礎クイズ' }),
  description: z.string().nullable().openapi({ example: 'JavaScriptの基本的な概念に関するクイズです' }),
  category: z.string().nullable().openapi({ example: 'プログラミング' }),
  is_public: z.boolean().openapi({ example: true }),
  author_id: z.string().openapi({ example: '1' }),
  created_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' }),
  updated_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('QuizSet')

// クイズセット作成用スキーマ
export const CreateQuizSetSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください').openapi({ example: 'React基礎クイズ' }),
  description: z.string().optional().openapi({ example: 'Reactの基本的な概念を学習するクイズです' }),
  category: z.string().optional().openapi({ example: 'フロントエンド' })
}).openapi('CreateQuizSet')

// クイズセット更新用スキーマ
export const UpdateQuizSetSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください').optional().openapi({ example: 'Vue.js基礎クイズ' }),
  description: z.string().optional().openapi({ example: 'Vue.jsの基本的な概念を学習するクイズです' }),
  category: z.string().optional().openapi({ example: 'フロントエンド' })
}).openapi('UpdateQuizSet')

// 公開状態切り替え用スキーマ
export const TogglePublishSchema = z.object({
  is_public: z.boolean().openapi({ example: true })
}).openapi('TogglePublish')

// パスパラメータ用スキーマ
export const QuizSetParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'IDは数値である必要があります').openapi({
    param: { name: 'id', in: 'path' },
    example: '1'
  })
})

// クエリパラメータ用スキーマ  
export const QuizSetQuerySchema = z.object({
  category: z.string().optional().openapi({
    param: { name: 'category', in: 'query' },
    example: 'プログラミング'
  }),
  author_id: z.string().regex(/^\d+$/).optional().openapi({
    param: { name: 'author_id', in: 'query' },
    example: '1'
  })
})

// クイズセットリスト用スキーマ
export const QuizSetListSchema = z.array(QuizSetSchema).openapi('QuizSetList')