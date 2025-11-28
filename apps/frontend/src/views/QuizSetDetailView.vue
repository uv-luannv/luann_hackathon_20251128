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
            <h1 class="text-2xl font-bold text-foreground">クイズセット詳細</h1>
          </div>
          <div class="flex items-center gap-4">
            <DarkModeToggle />
            <div v-if="authStore.currentUser" class="flex items-center gap-2 text-sm text-muted-foreground bg-white/50 dark:bg-black/30 px-3 py-1 rounded-full">
              <div class="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                <span class="text-white text-xs font-bold">{{ (authStore.currentUser?.name || 'G')[0] }}</span>
              </div>
              <span class="font-medium">{{ authStore.currentUser?.name }}</span>
            </div>
            <Button v-if="!authStore.isLoggedIn" @click="$router.push('/login')" variant="outline">
              ログイン
            </Button>
            <Button v-if="authStore.isLoggedIn" @click="handleLogout" variant="outline" class="hover-lift">
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <!-- ローディング表示 -->
      <LoadingSkeleton v-if="quizStore.loading" :card-count="1" :show-hero="true" />

      <!-- エラーメッセージ -->
      <ErrorMessage v-if="quizStore.error" :message="quizStore.error" @dismiss="quizStore.clearError()" />

      <!-- クイズセット詳細 -->
      <div v-if="quizSet && !quizStore.loading" class="space-y-8">
        <!-- ヘッダーセクション -->
        <div class="bg-gradient-primary rounded-2xl p-8 text-white">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-4">
                <h1 class="text-3xl font-bold">{{ quizSet.title }}</h1>
                <Badge :variant="quizSet.is_public ? 'outline' : 'secondary'" class="text-white border-white/30 bg-white/20">
                  {{ quizSet.is_public ? '公開' : '非公開' }}
                </Badge>
              </div>
              <p v-if="quizSet.description" class="text-white/90 text-lg mb-4">
                {{ quizSet.description }}
              </p>
              <div class="flex items-center gap-6 text-sm text-white/80">
                <div class="flex items-center gap-2">
                  <BookOpen class="size-4" />
                  <span>{{ quizSet.category || 'カテゴリなし' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Users class="size-4" />
                  <span>{{ quizSet.rating_count || 0 }}人が挑戦</span>
                </div>
                <div class="flex items-center gap-2">
                  <Calendar class="size-4" />
                  <span>{{ formatDate(quizSet.created_at) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <User class="size-4" />
                  <span>{{ quizSet.author_id }}</span>
                </div>
              </div>
            </div>
            <div class="shrink-0 flex flex-col sm:flex-row gap-3">
              <Button 
                v-if="canEdit" 
                @click="$router.push(`/quiz-sets/${quizSet.id}/edit`)" 
                variant="outline" 
                class="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Edit class="size-4 mr-2" />
                編集
              </Button>
              <Button 
                v-if="authStore.isLoggedIn"
                @click="startChallenge" 
                class="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Play class="size-4 mr-2" />
                チャレンジ開始
              </Button>
            </div>
          </div>
        </div>

        <!-- レーティングセクション -->
        <div class="card-enhanced p-6">
          <h2 class="text-xl font-bold mb-4">評価</h2>
          <StarRating
            :value="quizSet.average_rating"
            :rating-count="quizSet.rating_count"
            :show-count="true"
            :readonly="!authStore.isLoggedIn || (authStore.currentUser?.id?.toString() === quizSet.author_id)"
            :is-own="authStore.currentUser?.id?.toString() === quizSet.author_id"
            :quiz-set-id="quizSet.id"
            @submit="(rating) => handleRatingSubmit(rating)"
            class="mb-4"
          />
          <p v-if="!authStore.isLoggedIn" class="text-sm text-muted-foreground">
            ログインして評価を投稿できます
          </p>
          <p v-else-if="authStore.currentUser?.id?.toString() === quizSet.author_id" class="text-sm text-muted-foreground">
            自分のクイズセットには評価できません
          </p>
        </div>

        <!-- ランキングセクション -->
        <div class="card-enhanced p-6">
          <h2 class="text-xl font-bold mb-6">ランキング（トップ10）</h2>
          <QuizRanking :quiz-set-id="quizSet.id" />
        </div>
      </div>

      <!-- クイズセットが見つからない場合 -->
      <div v-if="!quizSet && !quizStore.loading && !quizStore.error" class="text-center py-12">
        <h2 class="text-2xl font-bold mb-4">クイズセットが見つかりません</h2>
        <p class="text-muted-foreground mb-6">
          このクイズセットは存在しないか、アクセス権限がありません。
        </p>
        <Button @click="$router.push('/quiz')">
          クイズ一覧に戻る
        </Button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuizStore } from '@/stores/quiz.store';
import { useAuthStore } from '@/stores/auth.store';

// UI components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue';
import StarRating from '@/components/StarRating.vue';
import QuizRanking from '@/components/QuizRanking.vue';

// Icons
import { 
  ArrowLeft,
  Edit,
  Play,
  BookOpen,
  Users,
  Calendar,
  User
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

// Computed
const canEdit = computed(() => {
  return authStore.isLoggedIn && 
         authStore.currentUser?.id?.toString() === quizSet.value?.author_id;
});

// Methods
const loadQuizSet = async () => {
  const id = route.params.id as string;
  if (id) {
    await quizStore.fetchQuizSetById(id);
  }
};

const goBack = () => {
  router.back();
};

const startChallenge = () => {
  if (!authStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  
  router.push(`/quiz-sets/${quizSet.value?.id}/challenge`);
};

const handleRatingSubmit = async (rating: number) => {
  if (!quizSet.value) return;
  
  try {
    await quizStore.submitRating(quizSet.value.id, rating);
    // Refresh quiz set to get updated rating
    await loadQuizSet();
  } catch (error) {
    // エラーはストアで処理される
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
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