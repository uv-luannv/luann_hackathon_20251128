import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  StartChallenge,
  SubmitChallengeRequest,
  ChallengeResult,
  Ranking,
  ScoreHistory,
  ChallengeAnswer
} from '@/types';
import * as challengeService from '@/services/challenge.service';
import { ApiError } from '@/services/api';
import { useAuthStore } from './auth.store';

/**
 * チャレンジ管理ストア
 * クイズチャレンジの実行、結果、ランキング、スコア履歴の管理
 */
export const useChallengeStore = defineStore('challenge', () => {
  // Auth store for error handling
  const authStore = useAuthStore();

  // State - 現在進行中のチャレンジ
  const currentChallenge = ref<StartChallenge | null>(null);
  const currentAnswers = ref<Map<string, string>>(new Map());
  const timeRemaining = ref<number>(0);
  const isTimeUp = ref<boolean>(false);

  // State - チャレンジ結果
  const latestResult = ref<ChallengeResult | null>(null);
  const resultHistory = ref<ChallengeResult[]>([]);

  // State - ランキング
  const rankings = ref<{ [quizSetId: string]: Ranking }>({});

  // State - スコア履歴
  const myScores = ref<ScoreHistory>([]);

  // State - 読み込み状態
  const isLoading = ref<boolean>(false);
  const isSubmitting = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Getters
  /**
   * 現在のチャレンジが進行中かどうか
   */
  const isInProgress = computed(() => !!currentChallenge.value);

  /**
   * 現在の回答数
   */
  const currentAnswerCount = computed(() => currentAnswers.value.size);

  /**
   * 全質問数
   */
  const totalQuestions = computed(() => currentChallenge.value?.questions.length || 0);

  /**
   * 回答進捗率（％）
   */
  const progressPercentage = computed(() => {
    if (!totalQuestions.value) return 0;
    return Math.round((currentAnswerCount.value / totalQuestions.value) * 100);
  });

  /**
   * 回答完了かどうか
   */
  const isAnswersComplete = computed(() => {
    return currentAnswerCount.value === totalQuestions.value;
  });

  /**
   * 最新スコアの取得
   */
  const latestScore = computed(() => {
    if (!latestResult.value) return null;
    return {
      score: latestResult.value.correct_answers,
      total: latestResult.value.total_questions,
      percentage: latestResult.value.score_percentage
    };
  });

  // Actions - チャレンジ管理
  /**
   * チャレンジを開始する
   * @param quizSetId クイズセットID
   */
  async function startChallenge(quizSetId: string): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      const challenge = await challengeService.startChallenge(quizSetId);
      
      // 状態をリセット
      currentChallenge.value = challenge;
      currentAnswers.value = new Map();
      timeRemaining.value = 0;
      isTimeUp.value = false;
      latestResult.value = null;

    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          authStore.logout();
          error.value = 'ログインが必要です';
        } else {
          error.value = err.message || 'チャレンジの開始に失敗しました';
        }
      } else {
        error.value = 'チャレンジの開始に失敗しました';
      }
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 回答を保存する
   * @param questionId 質問ID
   * @param choiceId 選択肢ID
   */
  function saveAnswer(questionId: string, choiceId: string): void {
    currentAnswers.value.set(questionId, choiceId);
  }

  /**
   * 回答を削除する
   * @param questionId 質問ID
   */
  function removeAnswer(questionId: string): void {
    currentAnswers.value.delete(questionId);
  }

  /**
   * 指定された質問の回答を取得する
   * @param questionId 質問ID
   */
  function getAnswer(questionId: string): string | null {
    return currentAnswers.value.get(questionId) || null;
  }

  /**
   * チャレンジを送信する
   */
  async function submitChallenge(): Promise<ChallengeResult> {
    try {
      if (!currentChallenge.value) {
        throw new Error('進行中のチャレンジがありません');
      }

      if (!isAnswersComplete.value) {
        throw new Error('すべての質問に回答してください');
      }

      isSubmitting.value = true;
      error.value = null;

      // 回答をリクエスト形式に変換
      const answers: ChallengeAnswer[] = [];
      for (const [questionId, choiceId] of currentAnswers.value) {
        answers.push({ question_id: questionId, choice_id: choiceId });
      }

      const submitData: SubmitChallengeRequest = { answers };
      const result = await challengeService.submitChallenge(
        currentChallenge.value.quiz_set_id,
        submitData
      );

      // 結果を保存
      latestResult.value = result;
      resultHistory.value.unshift(result);

      // チャレンジ状態をクリア
      currentChallenge.value = null;
      currentAnswers.value = new Map();

      return result;

    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          authStore.logout();
          error.value = 'ログインが必要です';
        } else {
          error.value = err.message || 'チャレンジの送信に失敗しました';
        }
      } else {
        error.value = err instanceof Error ? err.message : 'チャレンジの送信に失敗しました';
      }
      throw err;
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * チャレンジを中断する
   */
  function cancelChallenge(): void {
    currentChallenge.value = null;
    currentAnswers.value = new Map();
    timeRemaining.value = 0;
    isTimeUp.value = false;
    error.value = null;
  }

  // Actions - 結果管理
  /**
   * チャレンジ結果を取得する
   * @param challengeId チャレンジID
   */
  async function getChallengeResult(challengeId: string): Promise<ChallengeResult> {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await challengeService.getChallengeResult(challengeId);
      latestResult.value = result;

      return result;

    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          authStore.logout();
          error.value = 'ログインが必要です';
        } else {
          error.value = err.message || 'チャレンジ結果の取得に失敗しました';
        }
      } else {
        error.value = 'チャレンジ結果の取得に失敗しました';
      }
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Actions - ランキング管理
  /**
   * クイズセットのランキングを取得する
   * @param quizSetId クイズセットID
   */
  async function getQuizSetRanking(quizSetId: string): Promise<Ranking> {
    try {
      isLoading.value = true;
      error.value = null;

      const ranking = await challengeService.getQuizSetRanking(quizSetId);
      rankings.value[quizSetId] = ranking;

      return ranking;

    } catch (err) {
      if (err instanceof ApiError) {
        error.value = err.message || 'ランキングの取得に失敗しました';
      } else {
        error.value = 'ランキングの取得に失敗しました';
      }
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 指定されたクイズセットのランキングを取得する（キャッシュから）
   * @param quizSetId クイズセットID
   */
  function getRanking(quizSetId: string): Ranking | null {
    return rankings.value[quizSetId] || null;
  }

  // Actions - スコア履歴管理
  /**
   * ユーザーのスコア履歴を取得する
   */
  async function fetchMyScores(): Promise<ScoreHistory> {
    try {
      isLoading.value = true;
      error.value = null;

      const scores = await challengeService.getMyScores();
      myScores.value = scores;

      return scores;

    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          authStore.logout();
          error.value = 'ログインが必要です';
        } else {
          error.value = err.message || 'スコア履歴の取得に失敗しました';
        }
      } else {
        error.value = 'スコア履歴の取得に失敗しました';
      }
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * ユーザーのスコア履歴を取得する（エイリアス）
   */
  async function getMyScores(): Promise<ScoreHistory> {
    return fetchMyScores();
  }

  // Utility actions
  /**
   * エラーをクリアする
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * 最新結果をクリアする
   */
  function clearLatestResult(): void {
    latestResult.value = null;
  }

  /**
   * ランキングキャッシュをクリアする
   */
  function clearRankings(): void {
    rankings.value = {};
  }

  /**
   * すべての状態をリセットする
   */
  function resetStore(): void {
    currentChallenge.value = null;
    currentAnswers.value = new Map();
    timeRemaining.value = 0;
    isTimeUp.value = false;
    latestResult.value = null;
    resultHistory.value = [];
    rankings.value = {};
    myScores.value = [];
    isLoading.value = false;
    isSubmitting.value = false;
    error.value = null;
  }

  return {
    // State
    currentChallenge,
    currentAnswers,
    timeRemaining,
    isTimeUp,
    latestResult,
    resultHistory,
    rankings,
    myScores,
    isLoading,
    isSubmitting,
    error,

    // Getters
    isInProgress,
    currentAnswerCount,
    totalQuestions,
    progressPercentage,
    isAnswersComplete,
    latestScore,

    // Actions
    startChallenge,
    saveAnswer,
    removeAnswer,
    getAnswer,
    submitChallenge,
    cancelChallenge,
    getChallengeResult,
    getQuizSetRanking,
    getRanking,
    fetchMyScores,
    getMyScores,
    clearError,
    clearLatestResult,
    clearRankings,
    resetStore
  };
});