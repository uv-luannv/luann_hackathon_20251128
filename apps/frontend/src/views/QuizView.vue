<template>
  <div class="min-h-screen bg-background">
    <!-- Navigation -->
    <nav class="border-b bg-background">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">クイズアプリ</h1>
          <div class="flex items-center gap-4">
            <span class="text-sm text-muted-foreground">{{ user?.name }}</span>
            <Button @click="handleLogout" variant="outline">
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