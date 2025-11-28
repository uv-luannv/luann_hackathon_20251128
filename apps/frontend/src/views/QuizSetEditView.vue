<template>
  <div class="min-h-screen bg-background">
    <!-- Navigation -->
    <nav class="border-b bg-gradient-secondary backdrop-blur-md">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Button @click="goBack" variant="ghost" size="sm" class="mr-2">
              <ArrowLeft class="size-4" />
              戻る
            </Button>
            <div class="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span class="text-white font-bold text-lg">Q</span>
            </div>
            <h1 class="text-2xl font-bold text-foreground">クイズセット編集</h1>
          </div>
          <div class="flex items-center gap-4">
            <DarkModeToggle />
            <div class="flex items-center gap-2 text-sm text-muted-foreground bg-white/50 dark:bg-black/30 px-3 py-1 rounded-full">
              <div class="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                <span class="text-white text-xs font-bold">{{ (authStore.currentUser?.name || 'G')[0] }}</span>
              </div>
              <span class="font-medium">{{ authStore.currentUser?.name }}</span>
            </div>
            <Button @click="handleLogout" variant="outline" class="hover-lift">
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <!-- ローディング表示 -->
      <LoadingSkeleton v-if="quizStore.loading" :card-count="2" :show-hero="true" />

      <!-- エラーメッセージ -->
      <ErrorMessage v-if="quizStore.error" :message="quizStore.error" @dismiss="quizStore.clearError()" />

      <!-- 権限チェック -->
      <div v-if="!canEdit && !quizStore.loading" class="text-center py-12">
        <h2 class="text-2xl font-bold mb-4">編集権限がありません</h2>
        <p class="text-muted-foreground mb-6">
          このクイズセットを編集する権限がありません。
        </p>
        <Button @click="$router.push('/quiz')">
          クイズ一覧に戻る
        </Button>
      </div>

      <!-- 編集コンテンツ -->
      <div v-if="quizSet && canEdit && !quizStore.loading" class="space-y-8">
        <!-- クイズセット情報編集セクション -->
        <div class="card-enhanced p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold">クイズセット情報</h2>
            <div class="flex items-center gap-2">
              <Button @click="togglePublish" variant="outline" size="sm" :disabled="isUpdating">
                <Globe class="size-4 mr-2" />
                {{ quizSet.is_public ? '非公開にする' : '公開する' }}
              </Button>
              <Button @click="showDeleteDialog = true" variant="destructive" size="sm">
                <Trash2 class="size-4 mr-2" />
                削除
              </Button>
            </div>
          </div>

          <form @submit.prevent="updateQuizSet" class="space-y-4">
            <div>
              <label for="title" class="block text-sm font-medium text-foreground mb-2">
                タイトル *
              </label>
              <Input
                id="title"
                v-model="editForm.title"
                type="text"
                required
                class="w-full"
                placeholder="クイズセットのタイトルを入力"
              />
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-foreground mb-2">
                説明
              </label>
              <textarea
                id="description"
                v-model="editForm.description"
                rows="3"
                class="w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="クイズセットの説明を入力（任意）"
              ></textarea>
            </div>

            <div>
              <label for="category" class="block text-sm font-medium text-foreground mb-2">
                カテゴリ
              </label>
              <Input
                id="category"
                v-model="editForm.category"
                type="text"
                class="w-full"
                placeholder="カテゴリを入力（例：数学、歴史、科学）"
              />
            </div>

            <div class="flex items-center gap-4 pt-4">
              <Button type="submit" :disabled="!isFormValid || isUpdating">
                {{ isUpdating ? '更新中...' : '更新' }}
              </Button>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe class="size-4" />
                <span class="font-medium">
                  {{ quizSet.is_public ? '公開中' : '非公開' }}
                </span>
              </div>
            </div>
          </form>
        </div>

        <!-- 問題管理セクション -->
        <div class="card-enhanced p-6">
          <QuestionManager :quiz-set-id="quizSet.id" />
        </div>
      </div>

      <!-- クイズセットが見つからない場合 -->
      <div v-if="!quizSet && !quizStore.loading && !quizStore.error" class="text-center py-12">
        <h2 class="text-2xl font-bold mb-4">クイズセットが見つかりません</h2>
        <p class="text-muted-foreground mb-6">
          このクイズセットは存在しないか、編集権限がありません。
        </p>
        <Button @click="$router.push('/quiz')">
          クイズ一覧に戻る
        </Button>
      </div>
    </main>

    <!-- 削除確認ダイアログ -->
    <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>クイズセットを削除</DialogTitle>
          <DialogDescription>
            「{{ quizSet?.title }}」を削除してもよろしいですか？<br>
            この操作は取り消せません。すべての問題とチャレンジ履歴も削除されます。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">
            キャンセル
          </Button>
          <Button variant="destructive" @click="deleteQuizSet" :disabled="isDeleting">
            {{ isDeleting ? '削除中...' : '削除する' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuizStore } from '@/stores/quiz.store';
import { useAuthStore } from '@/stores/auth.store';

// UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue';
import QuestionManager from '@/components/QuestionManager.vue';

// Icons
import { 
  ArrowLeft,
  Globe,
  Trash2
} from 'lucide-vue-next';

// Components
import DarkModeToggle from '@/components/DarkModeToggle.vue';

// Setup
const route = useRoute();
const router = useRouter();
const quizStore = useQuizStore();
const authStore = useAuthStore();

// State
const quizSet = computed(() => quizStore.currentQuizSet);
const isUpdating = ref(false);
const isDeleting = ref(false);
const showDeleteDialog = ref(false);

const editForm = reactive({
  title: '',
  description: '',
  category: ''
});

// Computed
const canEdit = computed(() => {
  return authStore.isLoggedIn && 
         authStore.currentUser?.id?.toString() === quizSet.value?.author_id;
});

const isFormValid = computed(() => {
  return editForm.title.trim() !== '';
});

// Methods
const loadQuizSet = async () => {
  const id = route.params.id as string;
  if (id) {
    await quizStore.fetchQuizSetById(id);
    if (quizSet.value) {
      editForm.title = quizSet.value.title;
      editForm.description = quizSet.value.description || '';
      editForm.category = quizSet.value.category || '';
    }
  }
};

const goBack = () => {
  router.back();
};

const updateQuizSet = async () => {
  if (!quizSet.value || !isFormValid.value) return;

  isUpdating.value = true;
  try {
    await quizStore.updateQuizSet(quizSet.value.id, {
      title: editForm.title.trim(),
      description: editForm.description.trim() || undefined,
      category: editForm.category.trim() || undefined
    });
  } catch (error) {
    // エラーはストアで処理される
  } finally {
    isUpdating.value = false;
  }
};

const togglePublish = async () => {
  if (!quizSet.value) return;

  try {
    await quizStore.toggleQuizSetPublish(quizSet.value.id, !quizSet.value.is_public);
  } catch (error) {
    // エラーはストアで処理される
  }
};

const deleteQuizSet = async () => {
  if (!quizSet.value) return;

  isDeleting.value = true;
  try {
    await quizStore.deleteQuizSet(quizSet.value.id);
    showDeleteDialog.value = false;
    router.push('/quiz');
  } catch (error) {
    // エラーはストアで処理される
  } finally {
    isDeleting.value = false;
  }
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

// Lifecycle
onMounted(() => {
  loadQuizSet();
});

// Watch route changes
watch(() => route.params.id, () => {
  loadQuizSet();
});
</script>