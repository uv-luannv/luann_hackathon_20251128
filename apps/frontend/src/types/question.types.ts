// 選択肢の型定義
export interface Choice {
  id: string;
  question_id: string;
  choice_text: string;
  is_correct: boolean;
}

// 質問の型定義
export interface Question {
  id: string;
  quiz_set_id: string;
  question_text: string;
  choices?: Choice[];
  created_at: string;
  updated_at: string;
}

// 選択肢作成用の型
export interface CreateChoiceRequest {
  choice_text: string;
  is_correct: boolean;
}

// 質問作成用の型
export interface CreateQuestionRequest {
  question_text: string;
  choices: CreateChoiceRequest[];
}

// 質問更新用の型
export interface UpdateQuestionRequest {
  question_text?: string;
  choices?: CreateChoiceRequest[];
}