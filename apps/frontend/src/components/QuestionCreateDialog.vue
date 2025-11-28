<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>新しい質問を追加</DialogTitle>
        <DialogDescription>
          質問文と4つの選択肢を入力してください。正解は1つだけ選択できます。
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="space-y-4">
          <!-- 質問文 -->
          <div class="space-y-2">
            <Label for="question-text">質問文 <span class="text-destructive">*</span></Label>
            <Textarea
              id="question-text"
              v-model="formData.question_text"
              placeholder="質問を入力してください"
              rows="3"
              :class="{ 'border-destructive': errors.question_text }"
              required
            />
            <div v-if="errors.question_text" class="text-sm text-destructive">
              {{ errors.question_text }}
            </div>
          </div>

          <!-- 選択肢 -->
          <div class="space-y-3">
            <Label>選択肢 <span class="text-destructive">*</span></Label>
            <div 
              v-for="(choice, index) in formData.choices"
              :key="index"
              class="flex items-center gap-3 p-3 border rounded-lg"
            >
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {{ String.fromCharCode(65 + index) }}
              </div>
              <Input
                v-model="choice.choice_text"
                :placeholder="`選択肢${String.fromCharCode(65 + index)}を入力`"
                class="flex-1"
                required
              />
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  :name="'correct-choice'"
                  :value="index"
                  v-model="correctChoiceIndex"
                  class="w-4 h-4 text-primary"
                />
                <span class="text-sm">正解</span>
              </label>
            </div>
            <div v-if="errors.choices" class="text-sm text-destructive">
              {{ errors.choices }}
            </div>
          </div>
        </div>

        <!-- エラーメッセージ -->
        <ErrorMessage v-if="error" :message="error" />

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleCancel" :disabled="loading">
            キャンセル
          </Button>
          <Button type="submit" :disabled="loading || !isFormValid">
            <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            追加
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuizStore } from '@/stores/quiz.store';
import type { Question, CreateQuestionRequest } from '@/types';

// UI components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ErrorMessage from '@/components/common/ErrorMessage.vue';

// Props & Emits
interface Props {
  open: boolean;
  quizSetId: string;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'created', question: Question): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const quizStore = useQuizStore();

const formData = ref<CreateQuestionRequest>({
  question_text: '',
  choices: [
    { choice_text: '', is_correct: false },
    { choice_text: '', is_correct: false },
    { choice_text: '', is_correct: false },
    { choice_text: '', is_correct: false }
  ]
});

const correctChoiceIndex = ref<number>(0);
const errors = ref<Partial<Record<string, string>>>({});
const loading = ref(false);
const error = ref<string | null>(null);

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
});

const isFormValid = computed(() => {
  return (
    formData.value.question_text.trim().length > 0 &&
    formData.value.choices.every(choice => choice.choice_text.trim().length > 0) &&
    Object.keys(errors.value).length === 0
  );
});

// Methods
const validateForm = () => {
  errors.value = {};

  if (!formData.value.question_text.trim()) {
    errors.value.question_text = '質問文は必須です';
  }

  const hasEmptyChoices = formData.value.choices.some(choice => !choice.choice_text.trim());
  if (hasEmptyChoices) {
    errors.value.choices = 'すべての選択肢を入力してください';
  }

  return Object.keys(errors.value).length === 0;
};

const resetForm = () => {
  formData.value = {
    question_text: '',
    choices: [
      { choice_text: '', is_correct: false },
      { choice_text: '', is_correct: false },
      { choice_text: '', is_correct: false },
      { choice_text: '', is_correct: false }
    ]
  };
  correctChoiceIndex.value = 0;
  errors.value = {};
  error.value = null;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // Set correct answer
    formData.value.choices.forEach((choice, index) => {
      choice.is_correct = index === correctChoiceIndex.value;
    });

    const newQuestion = await quizStore.createQuestion(props.quizSetId, formData.value);
    emit('created', newQuestion);
    resetForm();
  } catch (err: any) {
    error.value = err.message || '質問の作成に失敗しました';
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  resetForm();
  isOpen.value = false;
};

// Watch for correct choice change
watch(correctChoiceIndex, (newIndex) => {
  formData.value.choices.forEach((choice, index) => {
    choice.is_correct = index === newIndex;
  });
});

// Reset form when dialog opens
watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      resetForm();
    }
  }
);
</script>