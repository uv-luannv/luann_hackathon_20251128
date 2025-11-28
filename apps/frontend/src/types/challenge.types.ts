/**
 * Challenge related type definitions
 */

// チャレンジ基本型
export interface Challenge {
  id: string;
  user_id: string;
  quiz_set_id: string;
  score: number;
  is_first_attempt: boolean;
  created_at: string;
}

// チャレンジ回答型
export interface ChallengeAnswer {
  question_id: string;
  choice_id: string;
}

// チャレンジ開始時の質問型（正解情報なし）
export interface ChallengeQuestion {
  id: string;
  question_text: string;
  choices: {
    id: string;
    choice_text: string;
  }[];
}

// チャレンジ結果の質問型（正解情報あり）
export interface ChallengeResultQuestion {
  id: string;
  question_text: string;
  user_choice_id: string | null;
  correct_choice_id: string;
  is_correct: boolean;
  choices: {
    id: string;
    choice_text: string;
    is_correct: boolean;
  }[];
}

// チャレンジ開始レスポンス型
export interface StartChallenge {
  quiz_set_id: string;
  quiz_set_title: string;
  questions: ChallengeQuestion[];
}

// チャレンジ送信リクエスト型
export interface SubmitChallengeRequest {
  answers: ChallengeAnswer[];
}

// チャレンジ結果型
export interface ChallengeResult {
  challenge: Challenge;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  questions: ChallengeResultQuestion[];
}

// ランキングエントリ型
export interface RankingEntry {
  user_id: string;
  username: string;
  score: number;
  total_questions: number;
  score_percentage: number;
  created_at: string;
}

// ランキング型
export interface Ranking {
  quiz_set_id: string;
  quiz_set_title: string;
  rankings: RankingEntry[];
}

// スコア履歴エントリ型
export interface ScoreHistoryEntry {
  challenge: Challenge;
  quiz_set_title: string;
  total_questions: number;
  score_percentage: number;
}

// スコア履歴型
export type ScoreHistory = ScoreHistoryEntry[];

// チャレンジストア状態型
export interface ChallengeState {
  // 現在進行中のチャレンジ
  currentChallenge: StartChallenge | null;
  currentAnswers: Map<string, string>;
  
  // チャレンジ結果
  latestResult: ChallengeResult | null;
  
  // ランキング
  rankings: { [quizSetId: string]: Ranking };
  
  // スコア履歴
  myScores: ScoreHistory;
  
  // 読み込み状態
  isLoading: boolean;
  
  // エラー状態
  error: string | null;
}