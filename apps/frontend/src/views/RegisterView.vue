<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          ユーザー登録
        </h2>
        <p class="mt-2 text-center text-sm text-muted-foreground">
          新しいアカウントを作成してください
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-foreground">
              ユーザー名
            </label>
            <input
              id="username"
              v-model="formData.username"
              name="username"
              type="text"
              required
              class="mt-1 block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="ユーザー名を入力"
            />
          </div>
          <div>
            <label for="email" class="block text-sm font-medium text-foreground">
              メールアドレス
            </label>
            <input
              id="email"
              v-model="formData.email"
              name="email"
              type="email"
              required
              class="mt-1 block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="メールアドレスを入力"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-foreground">
              パスワード
            </label>
            <input
              id="password"
              v-model="formData.password"
              name="password"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="パスワードを入力"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? '登録中...' : '登録' }}
          </button>
        </div>

        <div class="text-center">
          <router-link
            to="/login"
            class="text-sm text-primary hover:text-primary/90 underline"
          >
            すでにアカウントをお持ちの場合はこちら
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores';

const router = useRouter();
const authStore = useAuthStore();

// フォームデータ
const formData = ref({
  username: '',
  email: '',
  password: ''
});

const loading = ref(false);

// フォームのバリデーション
const isFormValid = computed(() => {
  return formData.value.username.trim() !== '' &&
         formData.value.email.trim() !== '' &&
         formData.value.password.trim() !== '';
});

// 登録処理
const handleRegister = async () => {
  if (!isFormValid.value || loading.value) return;

  try {
    loading.value = true;
    
    // ユーザー登録API呼び出し
    await authStore.register({
      username: formData.value.username.trim(),
      email: formData.value.email.trim(),
      password: formData.value.password
    });

    // 登録成功後、クイズページにリダイレクト
    router.push('/quiz');
  } catch (error: any) {
    console.error('登録エラー:', error);
    alert(error.message || '登録に失敗しました。');
  } finally {
    loading.value = false;
  }
};
</script>