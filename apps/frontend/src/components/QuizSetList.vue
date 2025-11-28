<template>
  <div class="w-full">
    <!-- ヘッダー -->
    <div class="mb-8">
      <!-- Hero Section -->
      <div class="bg-gradient-primary rounded-2xl p-8 mb-6 text-white">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold mb-2">クイズアプリ</h1>
            <p class="text-white/90 text-lg">知識を試し、学びを深めよう</p>
            <div class="flex items-center gap-6 mt-4 text-sm text-white/80">
              <div class="flex items-center gap-2">
                <BookOpen class="size-4" />
                <span>{{ quizStore.totalQuizSets || 0 }} クイズセット</span>
              </div>
              <div class="flex items-center gap-2">
                <Users class="size-4" />
                <span>{{ authStore.currentUser?.name || 'ゲスト' }}</span>
              </div>
            </div>
          </div>
          <div class="shrink-0">
            <Button @click="showCreateDialog = true" class="bg-white/20 border-white/30 text-white hover:bg-white/30 gap-2">
              <Plus class="size-4" />
              クイズセット作成
            </Button>
          </div>
        </div>
      </div>

      <!-- 検索・フィルタセクション -->
      <div class="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div class="text-lg font-semibold text-foreground">
          利用可能なクイズセット
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative w-full sm:w-64">
            <Input
              v-model="quizStore.searchQuery"
              placeholder="クイズセットを検索..."
              class="pr-10 border-muted-foreground/20 focus:border-primary"
              @input="quizStore.setSearchQuery($event.target.value)"
            />
            <Search class="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          </div>
          
          <select
            v-model="quizStore.categoryFilter"
            @change="quizStore.setCategoryFilter(($event.target as HTMLSelectElement).value)"
            class="rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">全カテゴリ</option>
            <option v-for="(category, index) in quizStore.availableCategories" :key="index" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- エラーメッセージ -->
    <ErrorMessage v-if="quizStore.error" :message="quizStore.error" @dismiss="quizStore.clearError()" />

    <!-- ローディング表示 -->
    <LoadingSkeleton v-if="quizStore.loading" :card-count="6" :show-hero="false" />

    <!-- クイズセット一覧 -->
    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="quizSet in quizStore.paginatedQuizSets"
        :key="quizSet.id"
        class="card-enhanced group cursor-pointer interactive"
        @click="handleTakeQuiz(quizSet.id)"
      >
        <!-- カード上部のグラデーション -->
        <div class="h-2 bg-gradient-primary"></div>
        
        <div class="p-6">
          <!-- ヘッダー -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="font-bold text-xl line-clamp-2 group-hover:text-primary transition-colors">
                  {{ quizSet.title }}
                </h3>
                <Badge :variant="quizSet.is_public ? 'default' : 'outline'" class="text-xs shrink-0">
                  {{ quizSet.is_public ? '公開' : '非公開' }}
                </Badge>
              </div>
              <Badge v-if="quizSet.category" variant="secondary" class="text-xs">
                <BookOpen class="size-3 mr-1" />
                {{ quizSet.category }}
              </Badge>
            </div>
            
            <!-- アクションボタン -->
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="sm" 
                @click.stop="handleViewQuizSet(quizSet.id)" 
                class="size-8 p-0"
              >
                <Eye class="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                @click.stop="handleEditQuizSet(quizSet)" 
                class="size-8 p-0"
              >
                <Edit class="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                @click.stop="handleTogglePublish(quizSet)" 
                class="size-8 p-0"
              >
                <Globe class="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                @click.stop="handleDeleteQuizSet(quizSet)" 
                class="size-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 class="size-4" />
              </Button>
            </div>
          </div>

          <!-- 説明文 -->
          <p v-if="quizSet.description" class="text-sm text-muted-foreground mb-6 line-clamp-3">
            {{ quizSet.description }}
          </p>
          <div v-else class="mb-6">
            <span class="text-xs text-muted-foreground italic">説明なし</span>
          </div>

          <!-- 統計情報 -->
          <div class="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <div class="flex items-center gap-1">
              <Users class="size-4" />
              <span>{{ quizSet.rating_count || 0 }}人が挑戦</span>
            </div>
            <div class="flex items-center gap-1">
              <Calendar class="size-4" />
              <span>{{ formatDate(quizSet.created_at) }}</span>
            </div>
          </div>

          <!-- レーティング -->
          <div class="mb-6">
            <StarRating
              :value="quizSet.average_rating"
              :rating-count="quizSet.rating_count"
              :show-count="true"
              :readonly="authStore.currentUser?.id?.toString() === quizSet.author_id"
              :is-own="authStore.currentUser?.id?.toString() === quizSet.author_id"
              :quiz-set-id="quizSet.id"
              @submit="(rating) => handleRatingSubmit(quizSet.id, rating)"
            />
          </div>

          <!-- フッター -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <User class="size-4 text-white" />
              </div>
              <span class="text-sm font-medium">{{ quizSet.author_id || 'Unknown' }}</span>
            </div>
            
            <Button 
              @click.stop="handleTakeQuiz(quizSet.id)" 
              size="sm" 
              class="bg-gradient-primary hover:opacity-90 transition-opacity font-medium"
            >
              <Play class="size-4 mr-1" />
              開始
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
import { useAuthStore } from '@/stores/auth.store';
import type { QuizSet } from '@/types';

// UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue';
import QuizSetCreateDialog from './QuizSetCreateDialog.vue';
import QuizSetEditDialog from './QuizSetEditDialog.vue';
import StarRating from './StarRating.vue';

// Icons
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Globe, 
  Trash2,
  BookOpen,
  Users,
  Calendar,
  User,
  Play
} from 'lucide-vue-next';

// State
const router = useRouter();
const quizStore = useQuizStore();
const authStore = useAuthStore();

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

const handleRatingSubmit = async (quizSetId: string, rating: number) => {
  try {
    await quizStore.submitRating(quizSetId, rating);
  } catch (error) {
    // エラーはストアで処理される
  }
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