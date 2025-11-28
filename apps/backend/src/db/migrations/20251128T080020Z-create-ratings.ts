import type { Kysely } from 'kysely'
import { sql } from 'kysely'

// レーティング用テーブル作成マイグレーション
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('ratings')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => 
      col.references('users.id').notNull()
    )
    .addColumn('quiz_set_id', 'integer', (col) => 
      col.references('quiz_sets.id').onDelete('cascade').notNull()
    )
    .addColumn('rating', 'integer', (col) => 
      col.notNull().check(sql`rating >= 1 AND rating <= 5`)
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.defaultTo('now()').notNull()
    )
    .addColumn('updated_at', 'timestamp', (col) => 
      col.defaultTo('now()').notNull()
    )
    .execute()

  // ユニーク制約：一人のユーザーは一つのクイズセットに対して一つのレーティングのみ
  await db.schema.createIndex('idx_ratings_user_quiz_unique')
    .on('ratings')
    .columns(['user_id', 'quiz_set_id'])
    .unique()
    .execute()

  // レーティング検索用インデックス
  await db.schema.createIndex('idx_ratings_quiz_set_id')
    .on('ratings')
    .column('quiz_set_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_ratings_quiz_set_id').execute()
  await db.schema.dropIndex('idx_ratings_user_quiz_unique').execute()
  await db.schema.dropTable('ratings').execute()
}