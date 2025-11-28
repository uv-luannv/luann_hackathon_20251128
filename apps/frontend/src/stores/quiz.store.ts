import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  QuizSet, 
  CreateQuizSetRequest, 
  UpdateQuizSetRequest,
  QuizSetQueryParams,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  Rating
} from '@/types';
import * as quizService from '@/services/quiz.service';
import * as questionService from '@/services/question.service';
import * as ratingService from '@/services/rating.service';
import { ApiError } from '@/services/api';
import { useAuthStore } from './auth.store';

/**
 * クイズ管理ストア
 * クイズセットと質問データのCRUD操作と状態管理
 */
export const useQuizStore = defineStore('quiz', () => {
  // Auth store for error handling
  const authStore = useAuthStore();

  // State
  const quizSets = ref<QuizSet[]>([]);
  const currentQuizSet = ref<QuizSet | null>(null);
  const questions = ref<Question[]>([]);
  
  const isInitialized = ref<boolean>(false);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  
  const searchQuery = ref<string>('');
  const currentPage = ref<number>(1);
  const perPage = ref<number>(10);
  const categoryFilter = ref<string>('');

  // Getters
  /**
   * 全クイズセット数
   */
  const totalQuizSets = computed(() => quizSets.value.length);

  /**
   * 既存のクイズセット名リスト（重複チェック用）
   */
  const existingTitles = computed(() =>
    quizSets.value.map(quizSet => quizSet.title.toLowerCase())
  );

  /**
   * 検索とフィルタリングされたクイズセット
   */
  const filteredQuizSets = computed(() => {
    let filtered = quizSets.value;

    // カテゴリフィルタ
    if (categoryFilter.value) {
      filtered = filtered.filter(quizSet => 
        quizSet.category === categoryFilter.value
      );
    }

    // 検索クエリフィルタ
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(quizSet =>
        quizSet.title.toLowerCase().includes(query) ||
        (quizSet.description && quizSet.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  });

  /**
   * ページネーション適用後のクイズセット
   */
  const paginatedQuizSets = computed(() => {
    const start = (currentPage.value - 1) * perPage.value;
    const end = start + perPage.value;
    return filteredQuizSets.value.slice(start, end);
  });

  /**
   * 総ページ数
   */
  const totalPages = computed(() =>
    Math.ceil(filteredQuizSets.value.length / perPage.value)
  );

  /**
   * 利用可能なカテゴリ一覧
   */
  const availableCategories = computed(() => {
    const categories = new Set(
      quizSets.value
        .map(quizSet => quizSet.category)
        .filter(Boolean)
    );
    return Array.from(categories).sort();
  });

  // Actions
  /**
   * クイズセット一覧を取得
   */
  async function fetchQuizSets(params?: QuizSetQueryParams): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const fetchedQuizSets = await quizService.getQuizSets(params);
      quizSets.value = fetchedQuizSets;
      isInitialized.value = true;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        return;
      }
      error.value = err.message || 'クイズセット一覧の取得に失敗しました。';
    } finally {
      loading.value = false;
    }
  }

  /**
   * クイズセットをIDで取得
   */
  async function fetchQuizSetById(id: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const quizSet = await quizService.getQuizSetById(id);
      currentQuizSet.value = quizSet;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        return;
      }
      error.value = err.message || 'クイズセット情報の取得に失敗しました。';
    } finally {
      loading.value = false;
    }
  }

  /**
   * クイズセット作成
   */
  async function createQuizSet(input: CreateQuizSetRequest): Promise<QuizSet> {
    loading.value = true;
    error.value = null;

    try {
      const newQuizSet = await quizService.createQuizSet(input);
      quizSets.value.push(newQuizSet);
      return newQuizSet;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = err.message || 'クイズセットの作成に失敗しました。';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * クイズセット更新
   */
  async function updateQuizSet(id: string, input: UpdateQuizSetRequest): Promise<QuizSet> {
    loading.value = true;
    error.value = null;

    try {
      const updatedQuizSet = await quizService.updateQuizSet(id, input);
      
      // ローカルステートを更新
      const index = quizSets.value.findIndex(q => q.id === id);
      if (index !== -1) {
        quizSets.value[index] = updatedQuizSet;
      }
      
      if (currentQuizSet.value?.id === id) {
        currentQuizSet.value = updatedQuizSet;
      }

      return updatedQuizSet;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = err.message || 'クイズセットの更新に失敗しました。';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * クイズセットの公開状態を切り替え
   */
  async function toggleQuizSetPublish(id: string, isPublic: boolean): Promise<QuizSet> {
    loading.value = true;
    error.value = null;

    try {
      const updatedQuizSet = await quizService.toggleQuizSetPublish(id, { is_public: isPublic });
      
      // ローカルステートを更新
      const index = quizSets.value.findIndex(q => q.id === id);
      if (index !== -1) {
        quizSets.value[index] = updatedQuizSet;
      }
      
      if (currentQuizSet.value?.id === id) {
        currentQuizSet.value = updatedQuizSet;
      }

      return updatedQuizSet;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = err.message || 'クイズセットの公開状態変更に失敗しました。';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * クイズセット削除
   */
  async function deleteQuizSet(id: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await quizService.deleteQuizSet(id);
      
      // ローカルステートから削除
      const index = quizSets.value.findIndex(q => q.id === id);
      if (index !== -1) {
        quizSets.value.splice(index, 1);
      }
      
      if (currentQuizSet.value?.id === id) {
        currentQuizSet.value = null;
      }

      // 削除後、現在のページに項目がない場合は前のページに戻る
      if (paginatedQuizSets.value.length === 0 && currentPage.value > 1) {
        currentPage.value--;
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = err.message || 'クイズセットの削除に失敗しました。';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 指定クイズセットの質問一覧を取得
   */
  async function fetchQuestions(quizSetId: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const fetchedQuestions = await questionService.getQuestionsByQuizSetId(quizSetId);
      questions.value = fetchedQuestions;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        return;
      }
      error.value = err.message || '質問一覧の取得に失敗しました。';
    } finally {
      loading.value = false;
    }
  }

  /**
   * 質問作成
   */
  async function createQuestion(quizSetId: string, input: CreateQuestionRequest): Promise<Question> {
    loading.value = true;
    error.value = null;

    try {
      const newQuestion = await questionService.createQuestion(quizSetId, input);
      questions.value.push(newQuestion);
      return newQuestion;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = err.message || '質問の作成に失敗しました。';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 質問更新
   */
  async function updateQuestion(id: string, input: UpdateQuestionRequest): Promise<Question> {
    loading.value = true;
    error.value = null;

    try {
      const updatedQuestion = await questionService.updateQuestion(id, input);
      
      // ローカルステートを更新
      const index = questions.value.findIndex(q => q.id === id);
      if (index !== -1) {
        questions.value[index] = updatedQuestion;
      }

      return updatedQuestion;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = err.message || '質問の更新に失敗しました。';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 質問削除
   */
  async function deleteQuestion(id: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await questionService.deleteQuestion(id);
      
      // ローカルステートから削除
      const index = questions.value.findIndex(q => q.id === id);
      if (index !== -1) {
        questions.value.splice(index, 1);
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = err.message || '質問の削除に失敗しました。';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * クイズセットをIDで取得（ローカルから）
   */
  function getQuizSetById(id: string): QuizSet | undefined {
    return quizSets.value.find(quizSet => quizSet.id === id);
  }

  /**
   * 質問をIDで取得（ローカルから）
   */
  function getQuestionById(id: string): Question | undefined {
    return questions.value.find(question => question.id === id);
  }

  /**
   * 検索クエリを設定
   */
  function setSearchQuery(query: string): void {
    searchQuery.value = query;
    currentPage.value = 1;
  }

  /**
   * カテゴリフィルタを設定
   */
  function setCategoryFilter(category: string): void {
    categoryFilter.value = category;
    currentPage.value = 1;
  }

  /**
   * ページを設定
   */
  function setCurrentPage(page: number): void {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value));
  }

  /**
   * エラーのクリア
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * 現在のクイズセットをクリア
   */
  function clearCurrentQuizSet(): void {
    currentQuizSet.value = null;
    questions.value = [];
  }

  /**
   * クイズセットにレーティングを送信
   */
  async function submitRating(quizSetId: string, rating: number): Promise<Rating> {
    loading.value = true;
    error.value = null;

    try {
      const ratingResult = await ratingService.submitRating(quizSetId, rating);
      
      // 一覧から対象のクイズセットを再取得して更新
      await fetchQuizSets();
      
      return ratingResult;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = err.message || 'レーティングの送信に失敗しました。';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    quizSets,
    currentQuizSet,
    questions,
    isInitialized,
    loading,
    error,
    searchQuery,
    currentPage,
    perPage,
    categoryFilter,

    // Getters
    totalQuizSets,
    existingTitles,
    filteredQuizSets,
    paginatedQuizSets,
    totalPages,
    availableCategories,

    // Actions
    fetchQuizSets,
    fetchQuizSetById,
    createQuizSet,
    updateQuizSet,
    toggleQuizSetPublish,
    deleteQuizSet,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getQuizSetById,
    getQuestionById,
    setSearchQuery,
    setCategoryFilter,
    setCurrentPage,
    clearError,
    clearCurrentQuizSet,
    submitRating
  };
});