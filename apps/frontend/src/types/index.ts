/**
 * 型定義のエントリーポイント
 * すべての型定義をここから再エクスポート
 */

// ユーザー関連の型
export type {
  User,
  CreateUserInput,
  UpdateUserInput
} from './user.types';

// アイテム関連の型
export type {
  Item,
  CreateItemInput,
  UpdateItemInput
} from './item.types';

// 画像関連の型
export type {
  Image,
  ImageResponse,
  UploadUrlRequest,
  UploadUrlResponse,
  ConfirmUploadRequest,
  UploadUrlRequest as ImageUploadUrlRequest,
  UploadUrlResponse as ImageUploadUrlResponse,
  ConfirmUploadRequest as ImageConfirmUploadRequest
} from './image.types';

// 認証関連の型
export type {
  LoginCredentials,
  AuthError,
  AuthState
} from './auth.types';

// クイズ関連の型
export type {
  QuizSet,
  CreateQuizSetRequest,
  UpdateQuizSetRequest,
  TogglePublishRequest,
  QuizSetQueryParams
} from './quiz.types';

// 質問関連の型
export type {
  Choice,
  Question,
  CreateChoiceRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest
} from './question.types';

// チャレンジ関連の型
export type {
  Challenge,
  ChallengeAnswer,
  ChallengeQuestion,
  ChallengeResultQuestion,
  StartChallenge,
  SubmitChallengeRequest,
  ChallengeResult,
  RankingEntry,
  Ranking,
  ScoreHistoryEntry,
  ScoreHistory,
  ChallengeState
} from './challenge.types';

// レーティング関連の型
export type {
  Rating,
  SubmitRatingRequest
} from './rating.types';

// API関連の型
export type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  SessionResponse,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ItemResponse,
  CreateItemRequest,
  UpdateItemRequest,
  PaginationParams,
  PaginatedResponse
} from './api.types';