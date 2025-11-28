// レーティング関連の型定義

export interface Rating {
  id: string;
  user_id: string;
  quiz_set_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

// レーティング送信用の型
export interface SubmitRatingRequest {
  rating: number;
}