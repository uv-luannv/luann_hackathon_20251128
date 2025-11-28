<template>
  <div class="w-full">
    <!-- ヘッダー -->
    <div class="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
      <div class="flex gap-2">
        <Button @click="showCreateDialog = true" class="gap-2">
          <Plus class="size-4" />
          クイズセット作成
        </Button>
      </div>
      
      <!-- 検索・フィルタ -->
      <div class="flex flex-col sm:flex-row gap-2">
        <div class="relative w-full sm:w-64">
          <Input
            v-model="quizStore.searchQuery"
            placeholder="クイズセットを検索..."
            class="pr-10"
            @input="quizStore.setSearchQuery($event.target.value)"
          />
          <Search class="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
        </div>
        
        <select
          v-model="quizStore.categoryFilter"
          @change="quizStore.setCategoryFilter(($event.target as HTMLSelectElement).value)"
          class="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="">全カテゴリ</option>
          <option v-for="(category, index) in quizStore.availableCategories" :key="index" :value="category">
            {{ category }}
          </option>
        </select>
      </div>
    </div>

    <!-- エラーメッセージ -->
    <ErrorMessage v-if="quizStore.error" :message="quizStore.error" @dismiss="quizStore.clearError()" />

    <!-- ローディング表示 -->
    <div v-if="quizStore.loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- クイズセット一覧 -->
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="quizSet in quizStore.paginatedQuizSets"
        :key="quizSet.id"
        class="card-container p-6 hover:shadow-md transition-shadow duration-200"
      >
        <div class="flex flex-col h-full">
          <!-- ヘッダー -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="font-semibold text-lg mb-1 line-clamp-2">{{ quizSet.title }}</h3>
              <Badge v-if="quizSet.category" variant="secondary" class="text-xs">
                {{ quizSet.category }}
              </Badge>
            </div>
            <div class="flex items-center gap-1">
              <Badge :variant="quizSet.is_public ? 'default' : 'outline'" class="text-xs">
                {{ quizSet.is_public ? '公開' : '非公開' }}
              </Badge>
              <div class="flex">
                <Button variant="ghost" size="sm" @click="handleViewQuizSet(quizSet.id)" class="size-8 p-0">
                  <Eye class="size-4" />
                </Button>
                <Button variant="ghost" size="sm" @click="handleEditQuizSet(quizSet)" class="size-8 p-0">
                  <Edit class="size-4" />
                </Button>
                <Button variant="ghost" size="sm" @click="handleTogglePublish(quizSet)" class="size-8 p-0">
                  <Globe class="size-4" />
                </Button>
                <Button variant="ghost" size="sm" @click="handleDeleteQuizSet(quizSet)" class="size-8 p-0 text-destructive">
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <!-- 説明文 -->
          <p v-if="quizSet.description" class="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
            {{ quizSet.description }}
          </p>

          <!-- フッター -->
          <div class="flex items-center justify-between text-xs text-muted-foreground mt-auto">
            <span>{{ formatDate(quizSet.created_at) }}</span>
            <Button @click="handleTakeQuiz(quizSet.id)" size="sm" variant="outline">
              クイズ開始
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状態 -->
    <div v-if="!quizStore.loading && quizStore.filteredQuizSets.length === 0" class="text-center py-12">
      <div class="text-muted-foreground mb-4">
        {{ quizStore.searchQuery || quizStore.categoryFilter ? '検索条件に一致するクイズセットがありません' : 'クイズセットがありません' }}
      </div>
      <Button v-if="!quizStore.searchQuery && !quizStore.categoryFilter" @click="showCreateDialog = true">
        最初のクイズセットを作成
      </Button>
    </div>

    <!-- ページネーション -->
    <div v-if="quizStore.totalPages > 1" class="flex justify-center mt-6">
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="quizStore.currentPage === 1"
          @click="quizStore.setCurrentPage(quizStore.currentPage - 1)"
        >
          前のページ
        </Button>
        <span class="text-sm text-muted-foreground px-2">
          {{ quizStore.currentPage }} / {{ quizStore.totalPages }}
        </span>
        <Button
          variant="outline"
          size="sm"
          :disabled="quizStore.currentPage === quizStore.totalPages"
          @click="quizStore.setCurrentPage(quizStore.currentPage + 1)"
        >
          次のページ
        </Button>
      </div>
    </div>

    <!-- 作成ダイアログ -->
    <QuizSetCreateDialog v-model:open="showCreateDialog" @created="handleQuizSetCreated" />
    
    <!-- 編集ダイアログ -->
    <QuizSetEditDialog 
      v-model:open="showEditDialog" 
      :quiz-set="selectedQuizSet"
      @updated="handleQuizSetUpdated" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuizStore } from '@/stores/quiz.store';
import type { QuizSet } from '@/types';

// UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import QuizSetCreateDialog from './QuizSetCreateDialog.vue';
import QuizSetEditDialog from './QuizSetEditDialog.vue';

// Icons
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Globe, 
  Trash2 
} from 'lucide-vue-next';

// State
const router = useRouter();
const quizStore = useQuizStore();

const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const selectedQuizSet = ref<QuizSet | null>(null);

// Methods
const handleQuizSetCreated = (quizSet: QuizSet) => {
  showCreateDialog.value = false;
  // Navigate to edit view to add questions
  router.push(`/quiz-sets/${quizSet.id}/edit`);
};

const handleQuizSetUpdated = () => {
  showEditDialog.value = false;
  selectedQuizSet.value = null;
};

const handleViewQuizSet = (id: string) => {
  router.push(`/quiz-sets/${id}`);
};

const handleEditQuizSet = (quizSet: QuizSet) => {
  selectedQuizSet.value = quizSet;
  showEditDialog.value = true;
};

const handleTakeQuiz = (id: string) => {
  router.push(`/quiz-sets/${id}/challenge`);
};

const handleTogglePublish = async (quizSet: QuizSet) => {
  try {
    await quizStore.toggleQuizSetPublish(quizSet.id, !quizSet.is_public);
  } catch (error) {
    // Error is handled by store
  }
};

const handleDeleteQuizSet = async (quizSet: QuizSet) => {
  if (confirm(`「${quizSet.title}」を削除してもよろしいですか？`)) {
    try {
      await quizStore.deleteQuizSet(quizSet.id);
    } catch (error) {
      // Error is handled by store
    }
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Lifecycle
onMounted(() => {
  if (!quizStore.isInitialized) {
    quizStore.fetchQuizSets();
  }
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>