<template>
  <div class="container max-w-6xl mx-auto p-6">
    <!-- ヘッダー -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <History class="size-8 text-blue-500" />
        <div>
          <h1 class="text-2xl font-bold">スコア履歴</h1>
          <p class="text-muted-foreground">
            あなたのクイズチャレンジの記録
          </p>
        </div>
      </div>
    </div>

    <!-- エラーメッセージ -->
    <ErrorMessage 
      v-if="challengeStore.error" 
      :message="challengeStore.error" 
      @dismiss="challengeStore.clearError()"
    />

    <!-- ローディング表示 -->
    <div v-if="challengeStore.isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- スコア履歴表示 -->
    <div v-else-if="challengeStore.myScores.length > 0" class="space-y-6">
      <!-- 統計サマリー -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <!-- 総チャレンジ数 -->
        <div class="card-container p-4 text-center">
          <div class="text-2xl font-bold text-blue-600">{{ totalChallenges }}</div>
          <div class="text-sm text-muted-foreground">総チャレンジ数</div>
        </div>

        <!-- 平均スコア -->
        <div class="card-container p-4 text-center">
          <div class="text-2xl font-bold text-green-600">{{ averageScore }}%</div>
          <div class="text-sm text-muted-foreground">平均スコア</div>
        </div>

        <!-- 最高スコア -->
        <div class="card-container p-4 text-center">
          <div class="text-2xl font-bold text-yellow-600">{{ bestScore }}%</div>
          <div class="text-sm text-muted-foreground">最高スコア</div>
        </div>

        <!-- 初回挑戦数 -->
        <div class="card-container p-4 text-center">
          <div class="text-2xl font-bold text-purple-600">{{ firstAttempts }}</div>
          <div class="text-sm text-muted-foreground">初回挑戦</div>
        </div>
      </div>

      <!-- フィルター -->
      <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div class="flex gap-2">
          <select
            v-model="sortOrder"
            class="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="newest">新しい順</option>
            <option value="oldest">古い順</option>
            <option value="highest">スコア高い順</option>
            <option value="lowest">スコア低い順</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            @click="showFirstAttemptsOnly = !showFirstAttemptsOnly"
            :class="{ 'bg-primary text-primary-foreground': showFirstAttemptsOnly }"
          >
            <Star class="size-4 mr-1" />
            初回挑戦のみ
          </Button>
        </div>

        <div class="text-sm text-muted-foreground">
          {{ filteredScores.length }} 件の記録
        </div>
      </div>

      <!-- スコア一覧 -->
      <div class="space-y-4">
        <div
          v-for="scoreEntry in paginatedScores"
          :key="scoreEntry.challenge.id"
          class="card-container p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex flex-col lg:flex-row lg:items-center gap-4">
            <!-- クイズ情報 -->
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="font-semibold text-lg">{{ scoreEntry.quiz_set_title }}</h3>
                <Badge v-if="scoreEntry.challenge.is_first_attempt" variant="secondary" class="text-xs">
                  <Star class="size-3 mr-1" />
                  初回挑戦
                </Badge>
              </div>
              <div class="text-sm text-muted-foreground">
                {{ formatDate(scoreEntry.challenge.created_at) }}
              </div>
            </div>

            <!-- スコア表示 -->
            <div class="flex items-center gap-6">
              <!-- スコア詳細 -->
              <div class="text-right">
                <div class="text-2xl font-bold" :class="getScoreColor(scoreEntry.score_percentage)">
                  {{ scoreEntry.score_percentage }}%
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ scoreEntry.challenge.score }} / {{ scoreEntry.total_questions }} 問正解
                </div>
              </div>

              <!-- スコアレベル -->
              <div class="text-center">
                <div class="text-3xl mb-1">{{ getScoreEmoji(scoreEntry.score_percentage) }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ getScoreLevel(scoreEntry.score_percentage) }}
                </div>
              </div>

              <!-- アクション -->
              <div class="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  @click="viewDetails(scoreEntry.challenge.id)"
                >
                  <Eye class="size-4 mr-1" />
                  詳細
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  @click="retryChallenge(scoreEntry.challenge.quiz_set_id)"
                >
                  <RotateCcw class="size-4 mr-1" />
                  再挑戦
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ページネーション -->
      <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          前へ
        </Button>
        
        <Button
          v-for="page in visiblePages"
          :key="page"
          :variant="page === currentPage ? 'default' : 'outline'"
          size="sm"
          @click="currentPage = page"
          class="min-w-[40px]"
        >
          {{ page }}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          次へ
        </Button>
      </div>
    </div>

    <!-- 空の状態 -->
    <div v-else class="text-center py-12">
      <History class="size-16 text-muted-foreground mx-auto mb-4" />
      <h2 class="text-xl font-medium mb-2">まだチャレンジ記録がありません</h2>
      <p class="text-muted-foreground mb-6">
        クイズにチャレンジしてスコア履歴を作成しましょう！
      </p>
      <Button @click="goToQuizList" variant="outline">
        <PlayCircle class="size-4 mr-2" />
        クイズ一覧へ
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  History,
  Star,
  Eye,
  RotateCcw,
  PlayCircle
} from 'lucide-vue-next';
import { useChallengeStore } from '@/stores/challenge.store';
import ErrorMessage from '@/components/common/ErrorMessage.vue';

const router = useRouter();
const challengeStore = useChallengeStore();

// フィルター・ソート設定
const sortOrder = ref<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
const showFirstAttemptsOnly = ref(false);

// ページネーション
const currentPage = ref(1);
const itemsPerPage = 10;

// 統計データ
const totalChallenges = computed(() => challengeStore.myScores.length);

const averageScore = computed(() => {
  if (challengeStore.myScores.length === 0) return 0;
  const sum = challengeStore.myScores.reduce((acc, score) => acc + score.score_percentage, 0);
  return Math.round(sum / challengeStore.myScores.length);
});

const bestScore = computed(() => {
  if (challengeStore.myScores.length === 0) return 0;
  return Math.max(...challengeStore.myScores.map(score => score.score_percentage));
});

const firstAttempts = computed(() => {
  return challengeStore.myScores.filter(score => score.challenge.is_first_attempt).length;
});

// フィルタリング・ソート済みのスコア
const filteredScores = computed(() => {
  let scores = [...challengeStore.myScores];
  
  // 初回挑戦フィルター
  if (showFirstAttemptsOnly.value) {
    scores = scores.filter(score => score.challenge.is_first_attempt);
  }
  
  // ソート
  switch (sortOrder.value) {
    case 'newest':
      scores.sort((a, b) => new Date(b.challenge.created_at).getTime() - new Date(a.challenge.created_at).getTime());
      break;
    case 'oldest':
      scores.sort((a, b) => new Date(a.challenge.created_at).getTime() - new Date(b.challenge.created_at).getTime());
      break;
    case 'highest':
      scores.sort((a, b) => b.score_percentage - a.score_percentage);
      break;
    case 'lowest':
      scores.sort((a, b) => a.score_percentage - b.score_percentage);
      break;
  }
  
  return scores;
});

// ページネーション
const totalPages = computed(() => Math.ceil(filteredScores.value.length / itemsPerPage));

const paginatedScores = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredScores.value.slice(start, start + itemsPerPage);
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];
  
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i);
  }
  
  return pages;
});

/**
 * スコアに基づく色を取得
 */
function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-blue-600';
  return 'text-red-600';
}

/**
 * スコアに基づく絵文字を取得
 */
function getScoreEmoji(percentage: number): string {
  if (percentage >= 90) return '🏆';
  if (percentage >= 80) return '🥇';
  if (percentage >= 70) return '🥈';
  if (percentage >= 60) return '🥉';
  if (percentage >= 50) return '😊';
  return '😢';
}

/**
 * スコアレベルを取得
 */
function getScoreLevel(percentage: number): string {
  if (percentage >= 90) return 'エクセレント';
  if (percentage >= 80) return 'とても良い';
  if (percentage >= 70) return '良い';
  if (percentage >= 60) return '普通';
  if (percentage >= 50) return 'もう少し';
  return '要努力';
}

/**
 * 日付をフォーマット
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * 詳細結果を表示
 */
async function viewDetails(challengeId: string): Promise<void> {
  try {
    await challengeStore.getChallengeResult(challengeId);
    // 結果ダイアログを表示するロジックを実装
    // 今回は簡易的に結果画面に遷移
    router.push(`/challenges/${challengeId}/result`);
  } catch (error) {
    console.error('チャレンジ詳細取得エラー:', error);
  }
}

/**
 * 再挑戦
 */
function retryChallenge(quizSetId: string): void {
  router.push(`/quiz/${quizSetId}/challenge`);
}

/**
 * クイズ一覧に移動
 */
function goToQuizList(): void {
  router.push('/quiz');
}

/**
 * スコア履歴を読み込み
 */
async function loadMyScores(): Promise<void> {
  try {
    await challengeStore.getMyScores();
  } catch (error) {
    console.error('スコア履歴取得エラー:', error);
    // エラーハンドリングはストア内で実行済み
  }
}

// ライフサイクル
onMounted(async () => {
  await loadMyScores();
});
</script>