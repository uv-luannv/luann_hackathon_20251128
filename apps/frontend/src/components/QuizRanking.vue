<template>
  <div class="container max-w-4xl mx-auto p-6">
    <!-- ヘッダー -->
    <div class="mb-6">
      <Button variant="ghost" @click="goBack" class="mb-4">
        <ArrowLeft class="size-4 mr-2" />
        戻る
      </Button>
      
      <div class="flex items-center gap-3">
        <Trophy class="size-8 text-yellow-500" />
        <div>
          <h1 class="text-2xl font-bold">ランキング</h1>
          <p v-if="ranking" class="text-muted-foreground">
            {{ ranking.quiz_set_title }}
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

    <!-- ランキング表示 -->
    <div v-else-if="ranking" class="space-y-6">
      <!-- 説明 -->
      <div class="bg-muted/20 p-4 rounded-lg">
        <p class="text-sm text-muted-foreground">
          <Info class="size-4 inline mr-1" />
          初回挑戦のスコアのみがランキングに反映されます
        </p>
      </div>

      <!-- ランキング一覧 -->
      <div v-if="ranking.rankings.length > 0" class="space-y-3">
        <div
          v-for="(entry, index) in ranking.rankings"
          :key="entry.user_id"
          class="card-container p-4 flex items-center gap-4"
          :class="{
            'ring-2 ring-yellow-200 bg-yellow-50': index === 0,
            'ring-2 ring-gray-200 bg-gray-50': index === 1,
            'ring-2 ring-amber-200 bg-amber-50': index === 2
          }"
        >
          <!-- 順位 -->
          <div class="flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg"
            :class="{
              'bg-yellow-500 text-white': index === 0,
              'bg-gray-400 text-white': index === 1,
              'bg-amber-600 text-white': index === 2,
              'bg-muted text-muted-foreground': index >= 3
            }"
          >
            {{ index + 1 }}
          </div>

          <!-- ユーザー情報 -->
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold">{{ entry.username }}</h3>
              <Badge v-if="isCurrentUser(entry.user_id)" variant="secondary" class="text-xs">
                あなた
              </Badge>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ formatDate(entry.created_at) }}
            </p>
          </div>

          <!-- スコア -->
          <div class="text-right">
            <div class="text-xl font-bold" :class="getScoreColor(entry.score_percentage)">
              {{ entry.score_percentage }}%
            </div>
            <div class="text-sm text-muted-foreground">
              {{ entry.score }} / {{ entry.total_questions }} 問正解
            </div>
          </div>

          <!-- トロフィーアイコン -->
          <div v-if="index < 3" class="w-8">
            <Trophy 
              v-if="index === 0" 
              class="size-6 text-yellow-500" 
            />
            <Award 
              v-else-if="index === 1" 
              class="size-6 text-gray-400" 
            />
            <Medal 
              v-else 
              class="size-6 text-amber-600" 
            />
          </div>
        </div>
      </div>

      <!-- 空の状態 -->
      <div v-else class="text-center py-12">
        <Trophy class="size-16 text-muted-foreground mx-auto mb-4" />
        <h2 class="text-xl font-medium mb-2">まだ誰もチャレンジしていません</h2>
        <p class="text-muted-foreground mb-6">
          最初にチャレンジしてランキングに載りましょう！
        </p>
        <Button @click="startChallenge" variant="outline">
          チャレンジを開始する
        </Button>
      </div>

      <!-- アクション -->
      <div class="flex justify-center gap-4 pt-6">
        <Button variant="outline" @click="startChallenge">
          <PlayCircle class="size-4 mr-2" />
          チャレンジに参加
        </Button>
        <Button variant="outline" @click="viewMyScores">
          <History class="size-4 mr-2" />
          自分のスコア履歴
        </Button>
      </div>
    </div>

    <!-- データが見つからない場合 -->
    <div v-else class="text-center py-12">
      <h2 class="text-xl font-medium mb-4">ランキングが見つかりません</h2>
      <Button @click="goBack" variant="outline">
        戻る
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Trophy,
  Award,
  Medal,
  Info,
  PlayCircle,
  History
} from 'lucide-vue-next';
import { useChallengeStore } from '@/stores/challenge.store';
import { useAuthStore } from '@/stores/auth.store';
import ErrorMessage from '@/components/common/ErrorMessage.vue';

const route = useRoute();
const router = useRouter();
const challengeStore = useChallengeStore();
const authStore = useAuthStore();

// 現在のクイズセットのランキングを取得
const ranking = computed(() => {
  const quizSetId = route.params.id as string;
  return challengeStore.getRanking(quizSetId);
});

/**
 * 現在のユーザーかどうかをチェック
 */
function isCurrentUser(userId: string): boolean {
  return authStore.currentUser?.id.toString() === userId;
}

/**
 * スコアに基づく色を取得
 */
function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-blue-600';
  return 'text-red-600';
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
 * チャレンジを開始
 */
function startChallenge(): void {
  const quizSetId = route.params.id as string;
  router.push(`/quiz/${quizSetId}/challenge`);
}

/**
 * 自分のスコア履歴を表示
 */
function viewMyScores(): void {
  router.push('/my-scores');
}

/**
 * 前のページに戻る
 */
function goBack(): void {
  router.push('/quiz');
}

/**
 * ランキングデータを読み込み
 */
async function loadRanking(): Promise<void> {
  const quizSetId = route.params.id as string;
  
  if (!quizSetId) {
    challengeStore.error = 'クイズセットIDが指定されていません';
    return;
  }

  try {
    await challengeStore.getQuizSetRanking(quizSetId);
  } catch (error) {
    console.error('ランキング取得エラー:', error);
    // エラーハンドリングはストア内で実行済み
  }
}

// ライフサイクル
onMounted(async () => {
  await loadRanking();
});
</script>