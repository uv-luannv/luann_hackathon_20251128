<template>
  <div class="container max-w-4xl mx-auto p-6">
    <!-- ヘッダー -->
    <div class="mb-8">
      <Button variant="ghost" @click="goBack" class="mb-6 hover-lift">
        <ArrowLeft class="size-4 mr-2" />
        戻る
      </Button>
      
      <!-- Hero section with gradient -->
      <div class="bg-gradient-primary rounded-2xl p-6 text-white mb-6">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h1 class="text-2xl font-bold mb-2">
              {{ challengeStore.currentChallenge?.quiz_set_title || 'クイズチャレンジ' }}
            </h1>
            <div class="flex items-center gap-6 text-white/90">
              <div class="flex items-center gap-2">
                <CheckCircle class="size-4" />
                <span>{{ challengeStore.currentAnswerCount }} / {{ challengeStore.totalQuestions }} 回答済み</span>
              </div>
              <div class="flex items-center gap-2">
                <Clock class="size-4" />
                <span>{{ challengeStore.progressPercentage }}% 完了</span>
              </div>
            </div>
          </div>
          
          <!-- 円形進捗インジケーター -->
          <div class="relative w-20 h-20">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16" cy="16" r="14"
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                stroke-width="2"
              />
              <circle
                cx="16" cy="16" r="14"
                fill="none"
                stroke="white"
                stroke-width="2"
                stroke-dasharray="87.96"
                :stroke-dashoffset="87.96 - (challengeStore.progressPercentage / 100) * 87.96"
                class="transition-all duration-500 ease-out"
                stroke-linecap="round"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-lg font-bold">{{ challengeStore.progressPercentage }}%</span>
            </div>
          </div>
        </div>
        
        <!-- プログレスバー -->
        <div class="mt-4">
          <div class="bg-white/20 rounded-full h-2">
            <div 
              class="bg-white rounded-full h-2 transition-all duration-500 ease-out"
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
        class="card-enhanced animate-slide-up interactive"
        :class="`stagger-${Math.min(index + 1, 5)}`"
      >
        <!-- 質問ヘッダー -->
        <div class="p-6 border-b border-border/50">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white text-sm font-bold">
              {{ index + 1 }}
            </div>
            <Badge 
              :variant="challengeStore.getAnswer(question.id) ? 'default' : 'outline'" 
              class="gap-1"
            >
              <CheckCircle v-if="challengeStore.getAnswer(question.id)" class="size-3" />
              <Circle v-else class="size-3" />
              {{ challengeStore.getAnswer(question.id) ? '回答済み' : '未回答' }}
            </Badge>
          </div>
          <h3 class="text-lg font-semibold leading-relaxed">{{ question.question_text }}</h3>
        </div>

        <!-- 選択肢 -->
        <div class="p-6 space-y-3">
          <label
            v-for="(choice, choiceIndex) in question.choices"
            :key="choice.id"
            class="flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover-lift group"
            :class="{
              'border-primary bg-primary/5 shadow-md': challengeStore.getAnswer(question.id) === choice.id,
              'border-border hover:border-primary/50 hover:bg-muted/50': challengeStore.getAnswer(question.id) !== choice.id
            }"
          >
            <div class="relative flex items-center mt-1">
              <input
                type="radio"
                :name="`question-${question.id}`"
                :value="choice.id"
                :checked="challengeStore.getAnswer(question.id) === choice.id"
                @change="handleAnswerSelect(question.id, choice.id)"
                class="sr-only"
              />
              <div 
                class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                :class="{
                  'border-primary bg-primary': challengeStore.getAnswer(question.id) === choice.id,
                  'border-muted-foreground group-hover:border-primary': challengeStore.getAnswer(question.id) !== choice.id
                }"
              >
                <div 
                  v-if="challengeStore.getAnswer(question.id) === choice.id"
                  class="w-2 h-2 rounded-full bg-white animate-scale-bounce"
                ></div>
              </div>
            </div>
            
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <span class="font-medium text-muted-foreground text-sm">{{ String.fromCharCode(65 + choiceIndex) }}.</span>
                <span class="text-base leading-relaxed">{{ choice.choice_text }}</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- 送信ボタン -->
      <div class="flex justify-center pt-8">
        <div class="text-center">
          <div v-if="!challengeStore.isAnswersComplete" class="mb-4">
            <p class="text-muted-foreground text-sm mb-2">
              あと {{ challengeStore.totalQuestions - challengeStore.currentAnswerCount }} 問回答してください
            </p>
            <div class="flex justify-center gap-2">
              <div 
                v-for="n in challengeStore.totalQuestions" 
                :key="n"
                class="w-3 h-3 rounded-full transition-all duration-300"
                :class="{
                  'bg-primary': n <= challengeStore.currentAnswerCount,
                  'bg-muted': n > challengeStore.currentAnswerCount
                }"
              ></div>
            </div>
          </div>
          
          <Button
            @click="handleSubmit"
            :disabled="!challengeStore.isAnswersComplete || challengeStore.isSubmitting"
            size="lg"
            class="px-12 bg-gradient-primary hover:opacity-90 font-semibold hover-lift button-press"
          >
            <span v-if="challengeStore.isSubmitting" class="flex items-center gap-3">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              送信中...
            </span>
            <span v-else-if="!challengeStore.isAnswersComplete">
              すべて回答してから送信
            </span>
            <span v-else class="flex items-center gap-2">
              <Send class="size-4" />
              回答を送信
            </span>
          </Button>
        </div>
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
import { ArrowLeft, CheckCircle, Circle, Clock, Send } from 'lucide-vue-next';
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