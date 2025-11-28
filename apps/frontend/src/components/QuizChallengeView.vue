<template>
  <div class="container max-w-4xl mx-auto p-6">
    <!-- ヘッダー -->
    <div class="mb-6">
      <Button variant="ghost" @click="goBack" class="mb-4">
        <ArrowLeft class="size-4 mr-2" />
        戻る
      </Button>
      
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold mb-1">
            {{ challengeStore.currentChallenge?.quiz_set_title || 'クイズチャレンジ' }}
          </h1>
          <div class="flex items-center gap-4 text-sm text-muted-foreground">
            <span>進捗: {{ challengeStore.currentAnswerCount }} / {{ challengeStore.totalQuestions }}</span>
            <span>完了率: {{ challengeStore.progressPercentage }}%</span>
          </div>
        </div>
        
        <!-- 進捗バー -->
        <div class="w-32">
          <div class="bg-muted rounded-full h-2 mb-1">
            <div 
              class="bg-primary rounded-full h-2 transition-all duration-300"
              :style="{ width: `${challengeStore.progressPercentage}%` }"
            ></div>
          </div>
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

    <!-- 質問一覧 -->
    <div v-else-if="challengeStore.currentChallenge" class="space-y-8">
      <div
        v-for="(question, index) in challengeStore.currentChallenge.questions"
        :key="question.id"
        class="card-container p-6"
      >
        <!-- 質問番号とテキスト -->
        <div class="mb-4">
          <div class="flex items-center gap-2 mb-2">
            <Badge variant="outline">質問 {{ index + 1 }}</Badge>
            <span v-if="challengeStore.getAnswer(question.id)" class="text-green-600 text-sm">✓ 回答済み</span>
          </div>
          <h3 class="text-lg font-medium">{{ question.question_text }}</h3>
        </div>

        <!-- 選択肢 -->
        <div class="space-y-2">
          <label
            v-for="choice in question.choices"
            :key="choice.id"
            class="flex items-center p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50"
            :class="{
              'border-primary bg-primary/5': challengeStore.getAnswer(question.id) === choice.id,
              'border-border': challengeStore.getAnswer(question.id) !== choice.id
            }"
          >
            <input
              type="radio"
              :name="`question-${question.id}`"
              :value="choice.id"
              :checked="challengeStore.getAnswer(question.id) === choice.id"
              @change="handleAnswerSelect(question.id, choice.id)"
              class="mr-3"
            />
            <span>{{ choice.choice_text }}</span>
          </label>
        </div>
      </div>

      <!-- 送信ボタン -->
      <div class="flex justify-center pt-6">
        <Button
          @click="handleSubmit"
          :disabled="!challengeStore.isAnswersComplete || challengeStore.isSubmitting"
          class="px-8"
        >
          <span v-if="challengeStore.isSubmitting" class="flex items-center gap-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            送信中...
          </span>
          <span v-else-if="!challengeStore.isAnswersComplete">
            すべての質問に回答してください ({{ challengeStore.currentAnswerCount }}/{{ challengeStore.totalQuestions }})
          </span>
          <span v-else>
            回答を送信
          </span>
        </Button>
      </div>
    </div>

    <!-- チャレンジが存在しない場合 -->
    <div v-else class="text-center py-12">
      <h2 class="text-xl font-medium mb-4">チャレンジが見つかりません</h2>
      <Button @click="goBack" variant="outline">
        クイズ一覧に戻る
      </Button>
    </div>

    <!-- 結果ダイアログ -->
    <QuizResultDialog
      :open="showResult"
      :result="challengeStore.latestResult"
      @close="handleResultClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-vue-next';
import { useChallengeStore } from '@/stores/challenge.store';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import QuizResultDialog from '@/components/QuizResultDialog.vue';

const route = useRoute();
const router = useRouter();
const challengeStore = useChallengeStore();

const showResult = ref(false);

/**
 * 回答選択ハンドラー
 * @param questionId 質問ID
 * @param choiceId 選択肢ID
 */
function handleAnswerSelect(questionId: string, choiceId: string): void {
  challengeStore.saveAnswer(questionId, choiceId);
}

/**
 * 回答送信ハンドラー
 */
async function handleSubmit(): Promise<void> {
  try {
    await challengeStore.submitChallenge();
    showResult.value = true;
  } catch (error) {
    console.error('チャレンジ送信エラー:', error);
  }
}

/**
 * 結果ダイアログを閉じる
 */
function handleResultClose(): void {
  showResult.value = false;
  challengeStore.clearLatestResult();
  goBack();
}

/**
 * 前のページに戻る
 */
function goBack(): void {
  router.push('/quiz');
}

/**
 * チャレンジを開始する
 */
async function initializeChallenge(): Promise<void> {
  const quizSetId = route.params.id as string;
  
  if (!quizSetId) {
    challengeStore.error = 'クイズセットIDが指定されていません';
    return;
  }

  try {
    await challengeStore.startChallenge(quizSetId);
  } catch (error) {
    console.error('チャレンジ開始エラー:', error);
    // エラーハンドリングはストア内で実行済み
  }
}

/**
 * ページを離れる前の確認
 */
function handleBeforeUnload(event: BeforeUnloadEvent): void {
  if (challengeStore.isInProgress && challengeStore.currentAnswerCount > 0) {
    event.preventDefault();
    event.returnValue = '回答が保存されていません。本当にページを離れますか？';
  }
}

// ライフサイクル
onMounted(async () => {
  await initializeChallenge();
  
  // ページを離れる前の警告を設定
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  
  // ストアの状態はそのまま保持（ブラウザバックで戻った時のため）
});
</script>