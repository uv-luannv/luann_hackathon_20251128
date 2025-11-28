import { z } from '@hono/zod-openapi'

// レーティングスキーマ
export const RatingSchema = z.object({
  id: z.string().openapi({ example: '1' }),
  user_id: z.string().openapi({ example: '1' }),
  quiz_set_id: z.string().openapi({ example: '1' }),
  rating: z.number().int().min(1).max(5).openapi({ example: 4 }),
  created_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' }),
  updated_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('Rating')

// レーティング作成・更新用スキーマ
export const CreateRatingSchema = z.object({
  rating: z.number().int().min(1, 'レーティングは1以上である必要があります').max(5, 'レーティングは5以下である必要があります').openapi({ example: 4 })
}).openapi('CreateRating')

// クイズセットID用パスパラメータスキーマ
export const RatingParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'IDは数値である必要があります').openapi({
    param: { name: 'id', in: 'path' },
    example: '1'
  })
})

// レーティング送信成功レスポンススキーマ
export const RatingResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: 'レーティングが正常に保存されました' }),
  data: RatingSchema
}).openapi('RatingResponse')