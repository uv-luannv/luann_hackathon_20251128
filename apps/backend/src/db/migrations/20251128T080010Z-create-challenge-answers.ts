import type { Kysely } from 'kysely'

// チャレンジ回答用テーブル作成マイグレーション
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('challenge_answers')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('challenge_id', 'integer', (col) => 
      col.references('challenges.id').onDelete('cascade').notNull()
    )
    .addColumn('question_id', 'integer', (col) => 
      col.references('questions.id').notNull()
    )
    .addColumn('choice_id', 'integer', (col) => 
      col.references('choices.id').notNull()
    )
    .execute()

  // チャレンジ用インデックス
  await db.schema.createIndex('idx_challenge_answers_challenge_id')
    .on('challenge_answers')
    .column('challenge_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_challenge_answers_challenge_id').execute()
  await db.schema.dropTable('challenge_answers').execute()
}