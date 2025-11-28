<template>
  <div class="min-h-screen bg-background">
    <!-- Navigation -->
    <nav class="border-b bg-gradient-secondary backdrop-blur-md">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span class="text-white font-bold text-lg">Q</span>
            </div>
            <h1 class="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">クイズアプリ</h1>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-sm text-muted-foreground bg-white/50 px-3 py-1 rounded-full">
              <div class="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                <span class="text-white text-xs font-bold">{{ (user?.name || 'G')[0] }}</span>
              </div>
              <span class="font-medium">{{ user?.name }}</span>
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
      <QuizSetList />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import QuizSetList from '@/components/QuizSetList.vue';

const router = useRouter();
const authStore = useAuthStore();

const user = computed(() => authStore.currentUser);

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
</script>