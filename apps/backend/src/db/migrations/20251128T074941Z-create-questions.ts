import type { Kysely } from 'kysely'

// 質問用テーブル作成マイグレーション
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('questions')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('quiz_set_id', 'integer', (col) => 
      col.references('quiz_sets.id').onDelete('cascade').notNull()
    )
    .addColumn('question_text', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo('now()').notNull()
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo('now()').notNull()
    )
    .execute()

  // クイズセット用インデックス
  await db.schema.createIndex('idx_questions_quiz_set_id')
    .on('questions')
    .column('quiz_set_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_questions_quiz_set_id').execute()
  await db.schema.dropTable('questions').execute()
}