<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Trophy v-if="result && result.score_percentage >= 80" class="size-6 text-yellow-500" />
          <Target v-else-if="result && result.score_percentage >= 60" class="size-6 text-blue-500" />
          <AlertCircle v-else class="size-6 text-red-500" />
          チャレンジ結果
        </DialogTitle>
      </DialogHeader>

      <div v-if="result" class="space-y-6">
        <!-- スコア表示 -->
        <div class="text-center p-6 bg-muted/20 rounded-lg">
          <div class="text-4xl font-bold mb-2" :class="getScoreColor(result.score_percentage)">
            {{ result.score_percentage }}%
          </div>
          <div class="text-lg text-muted-foreground">
            {{ result.correct_answers }} / {{ result.total_questions }} 問正解
          </div>
          <div class="mt-2">
            <Badge :variant="getScoreBadgeVariant(result.score_percentage)" class="text-sm">
              {{ getScoreMessage(result.score_percentage) }}
            </Badge>
          </div>
          
          <!-- 初回挑戦の表示 -->
          <div v-if="result.challenge.is_first_attempt" class="mt-3">
            <Badge variant="secondary" class="text-xs">
              <Star class="size-3 mr-1" />
              初回挑戦
            </Badge>
          </div>
        </div>

        <!-- 質問別結果 -->
        <div class="space-y-4">
          <h3 class="font-semibold text-lg">詳細結果</h3>
          
          <div class="space-y-4">
            <div
              v-for="(question, index) in result.questions"
              :key="question.id"
              class="border rounded-lg p-4"
              :class="{
                'border-green-200 bg-green-50': question.is_correct,
                'border-red-200 bg-red-50': !question.is_correct
              }"
            >
              <!-- 質問ヘッダー -->
              <div class="flex items-center gap-2 mb-3">
                <Badge variant="outline">質問 {{ index + 1 }}</Badge>
                <CheckCircle2 v-if="question.is_correct" class="size-5 text-green-600" />
                <XCircle v-else class="size-5 text-red-600" />
                <span :class="question.is_correct ? 'text-green-700' : 'text-red-700'" class="font-medium">
                  {{ question.is_correct ? '正解' : '不正解' }}
                </span>
              </div>

              <!-- 質問文 -->
              <h4 class="font-medium mb-3">{{ question.question_text }}</h4>

              <!-- 選択肢一覧 -->
              <div class="space-y-2">
                <div
                  v-for="choice in question.choices"
                  :key="choice.id"
                  class="flex items-center p-2 rounded border"
                  :class="getChoiceStyle(choice, question)"
                >
                  <div class="flex items-center gap-2 flex-1">
                    <!-- 選択状況のアイコン -->
                    <div class="w-6 flex justify-center">
                      <CheckCircle2 
                        v-if="choice.is_correct" 
                        class="size-5 text-green-600" 
                      />
                      <XCircle 
                        v-else-if="question.user_choice_id === choice.id && !choice.is_correct"
                        class="size-5 text-red-600" 
                      />
                      <div v-else class="w-5"></div>
                    </div>
                    
                    <!-- 選択肢テキスト -->
                    <span>{{ choice.choice_text }}</span>
                  </div>

                  <!-- ラベル -->
                  <div class="text-sm">
                    <Badge 
                      v-if="choice.is_correct" 
                      variant="secondary" 
                      class="text-xs text-green-700 bg-green-100"
                    >
                      正解
                    </Badge>
                    <Badge 
                      v-if="question.user_choice_id === choice.id && !choice.is_correct"
                      variant="secondary" 
                      class="text-xs text-red-700 bg-red-100"
                    >
                      あなたの回答
                    </Badge>
                  </div>
                </div>
              </div>

              <!-- 回答なしの場合 -->
              <div v-if="!question.user_choice_id" class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                この質問には回答されませんでした
              </div>
            </div>
          </div>
        </div>

        <!-- アクション -->
        <div class="flex justify-between items-center pt-4 border-t">
          <div class="flex gap-2">
            <Button variant="outline" @click="handleViewRanking">
              <BarChart class="size-4 mr-2" />
              ランキングを見る
            </Button>
            <Button variant="outline" @click="handleViewMyScores">
              <History class="size-4 mr-2" />
              スコア履歴
            </Button>
          </div>
          
          <div class="flex gap-2">
            <Button variant="outline" @click="handleTryAgain">
              <RotateCcw class="size-4 mr-2" />
              もう一度挑戦
            </Button>
            <Button @click="handleClose">
              閉じる
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Target,
  AlertCircle,
  Star,
  CheckCircle2,
  XCircle,
  BarChart,
  History,
  RotateCcw
} from 'lucide-vue-next';
import type { ChallengeResult, ChallengeResultQuestion } from '@/types';

interface Props {
  open: boolean;
  result: ChallengeResult | null;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const router = useRouter();

/**
 * スコアに基づく色を取得
 */
function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-blue-600';
  return 'text-red-600';
}

/**
 * スコアに基づくバッジのバリアントを取得
 */
function getScoreBadgeVariant(percentage: number): 'default' | 'secondary' | 'destructive' {
  if (percentage >= 80) return 'default';
  if (percentage >= 60) return 'secondary';
  return 'destructive';
}

/**
 * スコアに基づくメッセージを取得
 */
function getScoreMessage(percentage: number): string {
  if (percentage >= 90) return '素晴らしい！';
  if (percentage >= 80) return 'よくできました！';
  if (percentage >= 70) return 'いい感じです';
  if (percentage >= 60) return 'もう少しです';
  return '頑張りましょう';
}

/**
 * 選択肢のスタイルを取得
 */
function getChoiceStyle(choice: { id: string; choice_text: string; is_correct: boolean; }, question: ChallengeResultQuestion): string {
  const baseStyle = 'transition-colors';
  
  if (choice.is_correct) {
    return `${baseStyle} bg-green-100 border-green-300`;
  }
  
  if (question.user_choice_id === choice.id && !choice.is_correct) {
    return `${baseStyle} bg-red-100 border-red-300`;
  }
  
  return `${baseStyle} bg-white border-gray-200`;
}

/**
 * ダイアログの開閉ハンドラー
 */
function handleOpenChange(value: boolean): void {
  if (!value) {
    handleClose();
  }
}

/**
 * ダイアログを閉じる
 */
function handleClose(): void {
  emit('close');
}

/**
 * ランキング表示
 */
function handleViewRanking(): void {
  if (props.result) {
    router.push(`/quiz/${props.result.challenge.quiz_set_id}/ranking`);
    handleClose();
  }
}

/**
 * スコア履歴表示
 */
function handleViewMyScores(): void {
  router.push('/my-scores');
  handleClose();
}

/**
 * 再挑戦
 */
function handleTryAgain(): void {
  if (props.result) {
    router.push(`/quiz/${props.result.challenge.quiz_set_id}/challenge`);
    handleClose();
  }
}
</script>