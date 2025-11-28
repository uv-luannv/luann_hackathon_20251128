import type { Kysely } from 'kysely'

// 選択肢用テーブル作成マイグレーション
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('choices')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('question_id', 'integer', (col) => 
      col.references('questions.id').onDelete('cascade').notNull()
    )
    .addColumn('choice_text', 'varchar(255)', (col) => col.notNull())
    .addColumn('is_correct', 'boolean', (col) => col.notNull())
    .execute()

  // 質問用インデックス
  await db.schema.createIndex('idx_choices_question_id')
    .on('choices')
    .column('question_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_choices_question_id').execute()
  await db.schema.dropTable('choices').execute()
}