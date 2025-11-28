import type { Kysely } from 'kysely'

// クイズセット用テーブル作成マイグレーション
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('quiz_sets')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('category', 'varchar(100)')
    .addColumn('is_public', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('author_id', 'integer', (col) => 
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo('now()').notNull()
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo('now()').notNull()
    )
    .execute()

  // 作成者用インデックス
  await db.schema.createIndex('idx_quiz_sets_author_id')
    .on('quiz_sets')
    .column('author_id')
    .execute()

  // 公開状態用インデックス
  await db.schema.createIndex('idx_quiz_sets_is_public')
    .on('quiz_sets')
    .column('is_public')
    .execute()

  // カテゴリ用インデックス
  await db.schema.createIndex('idx_quiz_sets_category')
    .on('quiz_sets')
    .column('category')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_quiz_sets_category').execute()
  await db.schema.dropIndex('idx_quiz_sets_is_public').execute()
  await db.schema.dropIndex('idx_quiz_sets_author_id').execute()
  await db.schema.dropTable('quiz_sets').execute()
}