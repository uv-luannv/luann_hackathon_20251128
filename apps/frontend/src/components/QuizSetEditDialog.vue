<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>クイズセット情報を編集</DialogTitle>
        <DialogDescription>
          クイズセットのタイトル、説明、カテゴリを変更できます。
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="space-y-4">
          <!-- タイトル -->
          <div class="space-y-2">
            <Label for="edit-title">タイトル <span class="text-destructive">*</span></Label>
            <Input
              id="edit-title"
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
            <Label for="edit-description">説明</Label>
            <Textarea
              id="edit-description"
              v-model="formData.description"
              placeholder="クイズセットの説明を入力（任意）"
              rows="3"
            />
          </div>

          <!-- カテゴリ -->
          <div class="space-y-2">
            <Label for="edit-category">カテゴリ</Label>
            <Input
              id="edit-category"
              v-model="formData.category"
              placeholder="例：プログラミング、歴史、科学"
              list="edit-category-suggestions"
            />
            <datalist id="edit-category-suggestions">
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
          <Button type="submit" :disabled="loading || !isFormValid || !hasChanges">
            <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            更新
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuizStore } from '@/stores/quiz.store';
import type { QuizSet, UpdateQuizSetRequest } from '@/types';

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
  quizSet: QuizSet | null;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'updated', quizSet: QuizSet): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const quizStore = useQuizStore();

const formData = ref<UpdateQuizSetRequest>({
  title: '',
  description: '',
  category: ''
});

const originalData = ref<UpdateQuizSetRequest>({});
const errors = ref<Partial<Record<keyof UpdateQuizSetRequest, string>>>({});
const loading = ref(false);
const error = ref<string | null>(null);

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
});

const isFormValid = computed(() => {
  return formData.value.title && formData.value.title.trim().length > 0 && Object.keys(errors.value).length === 0;
});

const hasChanges = computed(() => {
  return (
    formData.value.title !== originalData.value.title ||
    formData.value.description !== originalData.value.description ||
    formData.value.category !== originalData.value.category
  );
});

const availableCategories = computed(() => quizStore.availableCategories);

// Methods
const validateForm = () => {
  errors.value = {};

  // タイトルの検証
  if (!formData.value.title || !formData.value.title.trim()) {
    errors.value.title = 'タイトルは必須です';
  } else if (formData.value.title.trim().length > 255) {
    errors.value.title = 'タイトルは255文字以内で入力してください';
  } else {
    // 他のクイズセットと重複していないかチェック（自分以外）
    const existingTitles = quizStore.existingTitles.filter((_, index) => {
      const quizSet = quizStore.quizSets[index];
      return quizSet && quizSet.id !== props.quizSet?.id;
    });
    
    if (existingTitles.includes(formData.value.title.trim().toLowerCase())) {
      errors.value.title = 'このタイトルは既に存在します';
    }
  }

  return Object.keys(errors.value).length === 0;
};

const loadQuizSetData = () => {
  if (props.quizSet) {
    formData.value = {
      title: props.quizSet.title,
      description: props.quizSet.description || '',
      category: props.quizSet.category || ''
    };
    
    originalData.value = { ...formData.value };
  }
};

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    category: ''
  };
  originalData.value = {};
  errors.value = {};
  error.value = null;
};

const handleSubmit = async () => {
  if (!validateForm() || !props.quizSet) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const updateData: UpdateQuizSetRequest = {};
    
    if (formData.value.title !== originalData.value.title) {
      updateData.title = formData.value.title?.trim();
    }
    
    if (formData.value.description !== originalData.value.description) {
      updateData.description = formData.value.description?.trim() || undefined;
    }
    
    if (formData.value.category !== originalData.value.category) {
      updateData.category = formData.value.category?.trim() || undefined;
    }

    const updatedQuizSet = await quizStore.updateQuizSet(props.quizSet.id, updateData);
    emit('updated', updatedQuizSet);
  } catch (err: any) {
    error.value = err.message || 'クイズセット情報の更新に失敗しました';
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  loadQuizSetData(); // 元のデータに戻す
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

// Load quiz set data when dialog opens or quiz set changes
watch(
  [() => props.open, () => props.quizSet],
  ([isOpen, quizSet]) => {
    if (isOpen && quizSet) {
      loadQuizSetData();
      error.value = null;
    } else if (!isOpen) {
      resetForm();
    }
  }
);
</script>