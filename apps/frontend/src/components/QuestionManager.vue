<template>
  <div class="space-y-6">
    <!-- ヘッダー -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">質問管理</h2>
      <Button @click="showCreateDialog = true" class="gap-2">
        <Plus class="size-4" />
        質問追加
      </Button>
    </div>

    <!-- エラーメッセージ -->
    <ErrorMessage v-if="quizStore.error" :message="quizStore.error" @dismiss="quizStore.clearError()" />

    <!-- ローディング -->
    <div v-if="quizStore.loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- 質問一覧 -->
    <div v-else-if="quizStore.questions.length > 0" class="space-y-4">
      <div
        v-for="(question, index) in quizStore.questions"
        :key="question.id"
        class="card-container p-6"
      >
        <div class="space-y-4">
          <!-- 質問ヘッダー -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm font-medium text-muted-foreground">質問 {{ index + 1 }}</span>
              </div>
              <h3 class="font-semibold text-lg">{{ question.question_text }}</h3>
            </div>
            <div class="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                @click="handleEditQuestion(question)"
                class="gap-2"
              >
                <Edit class="size-4" />
                編集
              </Button>
              <Button
                variant="destructive"
                size="sm"
                @click="handleDeleteQuestion(question)"
                class="gap-2"
              >
                <Trash2 class="size-4" />
                削除
              </Button>
            </div>
          </div>

          <!-- 選択肢 -->
          <div class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="(choice, choiceIndex) in question.choices"
              :key="choice.id"
              :class="[
                'flex items-center gap-3 p-3 rounded-lg border',
                choice.is_correct 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800'
              ]"
            >
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {{ String.fromCharCode(65 + choiceIndex) }}
              </div>
              <span class="flex-1">{{ choice.choice_text }}</span>
              <div v-if="choice.is_correct" class="flex-shrink-0">
                <CheckCircle class="size-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状態 -->
    <div v-else class="text-center py-12 border-2 border-dashed border-muted rounded-lg">
      <div class="text-muted-foreground mb-4">
        まだ質問が追加されていません
      </div>
      <Button @click="showCreateDialog = true">
        最初の質問を追加
      </Button>
    </div>

    <!-- 作成ダイアログ -->
    <QuestionCreateDialog 
      v-model:open="showCreateDialog" 
      :quiz-set-id="quizSetId"
      @created="handleQuestionCreated" 
    />
    
    <!-- 編集ダイアログ -->
    <QuestionEditDialog 
      v-model:open="showEditDialog" 
      :question="selectedQuestion"
      @updated="handleQuestionUpdated" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuizStore } from '@/stores/quiz.store';
import type { Question } from '@/types';

// UI components
import { Button } from '@/components/ui/button';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import QuestionCreateDialog from './QuestionCreateDialog.vue';
import QuestionEditDialog from './QuestionEditDialog.vue';

// Icons
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-vue-next';

// Props
interface Props {
  quizSetId: string;
}

const props = defineProps<Props>();

// State
const quizStore = useQuizStore();
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const selectedQuestion = ref<Question | null>(null);

// Methods
const handleQuestionCreated = () => {
  showCreateDialog.value = false;
};

const handleQuestionUpdated = () => {
  showEditDialog.value = false;
  selectedQuestion.value = null;
};

const handleEditQuestion = (question: Question) => {
  selectedQuestion.value = question;
  showEditDialog.value = true;
};

const handleDeleteQuestion = async (question: Question) => {
  if (confirm(`質問「${question.question_text}」を削除してもよろしいですか？`)) {
    try {
      await quizStore.deleteQuestion(question.id);
    } catch (error) {
      // Error is handled by store
    }
  }
};

// Lifecycle
onMounted(async () => {
  try {
    await quizStore.fetchQuestions(props.quizSetId);
  } catch (error) {
    // Error is handled by store
  }
});
</script>