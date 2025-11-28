// クイズセット関連の型定義
export interface QuizSet {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  is_public: boolean;
  author_id: string;
  average_rating: number | null;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

// クイズセット作成用の型
export interface CreateQuizSetRequest {
  title: string;
  description?: string;
  category?: string;
}

// クイズセット更新用の型
export interface UpdateQuizSetRequest {
  title?: string;
  description?: string;
  category?: string;
}

// 公開状態切り替え用の型
export interface TogglePublishRequest {
  is_public: boolean;
}

// クイズセット一覧のクエリパラメータ
export interface QuizSetQueryParams {
  category?: string;
  author_id?: string;
}