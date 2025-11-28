/**
 * レーティング関連のAPIサービス
 */
import { api, type ApiResponse } from './api';
import type { Rating } from '../types';

/**
 * クイズセットにレーティングを投稿する
 */
export async function submitRating(quizSetId: string, rating: number): Promise<Rating> {
  const response = await api<ApiResponse<Rating>>(`/quiz-sets/${quizSetId}/rate`, {
    method: 'POST',
    body: { rating }
  });

  if (!response.success || !response.data) {
    throw new Error(response.message || 'レーティングの送信に失敗しました');
  }

  return response.data;
}