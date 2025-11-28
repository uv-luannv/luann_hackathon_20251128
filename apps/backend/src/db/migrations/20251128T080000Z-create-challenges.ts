import type { Kysely } from 'kysely'

// チャレンジ用テーブル作成マイグレーション
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('challenges')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => 
      col.references('users.id').notNull()
    )
    .addColumn('quiz_set_id', 'integer', (col) => 
      col.references('quiz_sets.id').notNull()
    )
    .addColumn('score', 'integer', (col) => col.notNull())
    .addColumn('is_first_attempt', 'boolean', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()').notNull())
    .execute()

  // ユーザー用インデックス
  await db.schema.createIndex('idx_challenges_user_id')
    .on('challenges')
    .column('user_id')
    .execute()

  // クイズセット用インデックス
  await db.schema.createIndex('idx_challenges_quiz_set_id')
    .on('challenges')
    .column('quiz_set_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_challenges_user_id').execute()
  await db.schema.dropIndex('idx_challenges_quiz_set_id').execute()
  await db.schema.dropTable('challenges').execute()
}