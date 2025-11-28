/**
 * Quiz Service
 * Handles all quiz set related API calls
 */
import { api, ApiError } from './api';
import type {
  QuizSet,
  CreateQuizSetRequest,
  UpdateQuizSetRequest,
  TogglePublishRequest,
  QuizSetQueryParams
} from '@/types';

/**
 * Get all quiz sets
 */
export async function getQuizSets(params?: QuizSetQueryParams): Promise<QuizSet[]> {
  try {
    const queryParams = new URLSearchParams();

    if (params?.category) {
      queryParams.append('category', params.category);
    }
    if (params?.author_id) {
      queryParams.append('author_id', params.author_id);
    }

    const query = queryParams.toString();
    const url = `/quiz-sets${query ? `?${query}` : ''}`;

    const quizSets = await api<QuizSet[]>(url, {
      method: 'GET',
    });

    return quizSets;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('クイズセット一覧の取得に失敗しました');
  }
}

/**
 * Get quiz set by ID
 */
export async function getQuizSetById(id: string): Promise<QuizSet> {
  try {
    const quizSet = await api<QuizSet>(`/quiz-sets/${id}`, {
      method: 'GET',
    });

    return quizSet;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('クイズセット情報の取得に失敗しました');
  }
}

/**
 * Create new quiz set
 */
export async function createQuizSet(data: CreateQuizSetRequest): Promise<QuizSet> {
  try {
    const quizSet = await api<QuizSet>('/quiz-sets', {
      method: 'POST',
      body: data,
    });

    return quizSet;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('クイズセットの作成に失敗しました');
  }
}

/**
 * Update quiz set
 */
export async function updateQuizSet(
  id: string,
  data: UpdateQuizSetRequest
): Promise<QuizSet> {
  try {
    const quizSet = await api<QuizSet>(`/quiz-sets/${id}`, {
      method: 'PATCH',
      body: data,
    });

    return quizSet;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('クイズセット情報の更新に失敗しました');
  }
}

/**
 * Toggle quiz set publish status
 */
export async function toggleQuizSetPublish(
  id: string,
  data: TogglePublishRequest
): Promise<QuizSet> {
  try {
    const quizSet = await api<QuizSet>(`/quiz-sets/${id}/publish`, {
      method: 'PATCH',
      body: data,
    });

    return quizSet;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('クイズセットの公開状態変更に失敗しました');
  }
}

/**
 * Delete quiz set
 */
export async function deleteQuizSet(id: string): Promise<void> {
  try {
    await api(`/quiz-sets/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('クイズセットの削除に失敗しました');
  }
}