/**
 * Question Service
 * Handles all question and choice related API calls
 */
import { api, ApiError } from './api';
import type {
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest
} from '@/types';

/**
 * Get questions for a quiz set
 */
export async function getQuestionsByQuizSetId(quizSetId: string): Promise<Question[]> {
  try {
    const questions = await api<Question[]>(`/quiz-sets/${quizSetId}/questions`, {
      method: 'GET',
    });

    return questions;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('質問一覧の取得に失敗しました');
  }
}

/**
 * Create new question with choices
 */
export async function createQuestion(
  quizSetId: string,
  data: CreateQuestionRequest
): Promise<Question> {
  try {
    const question = await api<Question>(`/quiz-sets/${quizSetId}/questions`, {
      method: 'POST',
      body: data,
    });

    return question;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('質問の作成に失敗しました');
  }
}

/**
 * Update question and choices
 */
export async function updateQuestion(
  id: string,
  data: UpdateQuestionRequest
): Promise<Question> {
  try {
    const question = await api<Question>(`/questions/${id}`, {
      method: 'PATCH',
      body: data,
    });

    return question;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('質問の更新に失敗しました');
  }
}

/**
 * Delete question
 */
export async function deleteQuestion(id: string): Promise<void> {
  try {
    await api(`/questions/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('質問の削除に失敗しました');
  }
}