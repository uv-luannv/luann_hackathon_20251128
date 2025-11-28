/**
 * Challenge Service
 * Handles all challenge related API calls
 */
import { api, ApiError } from './api';
import type {
  StartChallenge,
  SubmitChallengeRequest,
  ChallengeResult,
  Ranking,
  ScoreHistory
} from '@/types';

/**
 * Start a challenge for a quiz set
 */
export async function startChallenge(quizSetId: string): Promise<StartChallenge> {
  try {
    const challenge = await api<StartChallenge>(`/quiz-sets/${quizSetId}/challenge/start`, {
      method: 'GET',
    });

    return challenge;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('チャレンジの開始に失敗しました');
  }
}

/**
 * Submit challenge answers
 */
export async function submitChallenge(
  quizSetId: string,
  data: SubmitChallengeRequest
): Promise<ChallengeResult> {
  try {
    const result = await api<ChallengeResult>(`/quiz-sets/${quizSetId}/challenge/submit`, {
      method: 'POST',
      body: data,
    });

    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('チャレンジの送信に失敗しました');
  }
}

/**
 * Get challenge result by ID
 */
export async function getChallengeResult(challengeId: string): Promise<ChallengeResult> {
  try {
    const result = await api<ChallengeResult>(`/challenges/${challengeId}/result`, {
      method: 'GET',
    });

    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('チャレンジ結果の取得に失敗しました');
  }
}

/**
 * Get quiz set ranking
 */
export async function getQuizSetRanking(quizSetId: string): Promise<Ranking> {
  try {
    const ranking = await api<Ranking>(`/quiz-sets/${quizSetId}/ranking`, {
      method: 'GET',
    });

    return ranking;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('ランキングの取得に失敗しました');
  }
}

/**
 * Get user's score history
 */
export async function getMyScores(): Promise<ScoreHistory> {
  try {
    const scores = await api<ScoreHistory>('/my-scores', {
      method: 'GET',
    });

    return scores;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('スコア履歴の取得に失敗しました');
  }
}