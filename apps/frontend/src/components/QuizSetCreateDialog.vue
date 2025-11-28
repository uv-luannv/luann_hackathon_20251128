<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>新しいクイズセットを作成</DialogTitle>
        <DialogDescription>
          クイズセットの基本情報を入力してください。作成後に質問を追加できます。
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="space-y-4">
          <!-- タイトル -->
          <div class="space-y-2">
            <Label for="title">タイトル <span class="text-destructive">*</span></Label>
            <Input
              id="title"
              v-model="formData.title"
              placeholder="クイズセットのタイトルを入力"
              :class="{ 'border-destructive': errors.title }"
              required
            />
            <div v-if="errors.title" class="text-sm text-destructive">
              {{ errors.title }}
            </div>
          </div>

          <!-- 説明 -->
          <div class="space-y-2">
            <Label for="description">説明</Label>
            <Textarea
              id="description"
              v-model="formData.description"
              placeholder="クイズセットの説明を入力（任意）"
              rows="3"
            />
          </div>

          <!-- カテゴリ -->
          <div class="space-y-2">
            <Label for="category">カテゴリ</Label>
            <Input
              id="category"
              v-model="formData.category"
              placeholder="例：プログラミング、歴史、科学"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              <option v-for="(category, index) in availableCategories" :key="index" :value="category" />
            </datalist>
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
            作成
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuizStore } from '@/stores/quiz.store';
import type { QuizSet, CreateQuizSetRequest } from '@/types';

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
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'created', quizSet: QuizSet): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const quizStore = useQuizStore();

const formData = ref<CreateQuizSetRequest>({
  title: '',
  description: '',
  category: ''
});

const errors = ref<Partial<Record<keyof CreateQuizSetRequest, string>>>({});
const loading = ref(false);
const error = ref<string | null>(null);

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
});

const isFormValid = computed(() => {
  return formData.value.title.trim().length > 0 && Object.keys(errors.value).length === 0;
});

const availableCategories = computed(() => quizStore.availableCategories);

// Methods
const validateForm = () => {
  errors.value = {};

  // タイトルの検証
  if (!formData.value.title.trim()) {
    errors.value.title = 'タイトルは必須です';
  } else if (formData.value.title.trim().length > 255) {
    errors.value.title = 'タイトルは255文字以内で入力してください';
  } else if (quizStore.existingTitles.includes(formData.value.title.trim().toLowerCase())) {
    errors.value.title = 'このタイトルは既に存在します';
  }

  return Object.keys(errors.value).length === 0;
};

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    category: ''
  };
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
    const createData: CreateQuizSetRequest = {
      title: formData.value.title.trim(),
      description: formData.value.description?.trim() || undefined,
      category: formData.value.category?.trim() || undefined
    };

    const newQuizSet = await quizStore.createQuizSet(createData);
    emit('created', newQuizSet);
    resetForm();
  } catch (err: any) {
    error.value = err.message || 'クイズセットの作成に失敗しました';
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  resetForm();
  isOpen.value = false;
};

// Watch for form changes to validate
watch(
  () => formData.value.title,
  () => {
    if (errors.value.title) {
      validateForm();
    }
  }
);

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