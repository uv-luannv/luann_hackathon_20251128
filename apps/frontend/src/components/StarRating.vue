<template>
  <div class="star-rating" :class="{ 'star-rating--readonly': readonly }">
    <!-- レーティング表示（読み取り専用モード） -->
    <div v-if="readonly" class="flex items-center gap-1">
      <div class="flex">
        <svg
          v-for="index in 5"
          :key="`display-${index-1}`"
          class="w-4 h-4"
          :class="getStarDisplayClass(index-1)"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="2"
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      </div>
      <span v-if="showCount && ratingCount > 0" class="text-sm text-muted-foreground">
        ({{ ratingCount }})
      </span>
    </div>

    <!-- レーティング入力（インタラクティブモード） -->
    <div v-else class="flex flex-col gap-2">
      <div class="flex items-center gap-1">
        <button
          v-for="index in 5"
          :key="`input-${index-1}`"
          type="button"
          class="transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          @click="handleStarClick(index)"
          @mouseenter="hoveredRating = index"
          @mouseleave="hoveredRating = 0"
          :disabled="disabled || loading"
        >
          <svg
            class="w-6 h-6"
            :class="getStarInputClass(index-1)"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            stroke-width="2"
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </button>
        <span v-if="currentRating > 0" class="ml-2 text-sm text-muted-foreground">
          {{ currentRating }} / 5
        </span>
      </div>

      <!-- 送信ボタン -->
      <div v-if="currentRating > 0" class="flex gap-2">
        <Button 
          @click="submitRating" 
          :disabled="loading"
          size="sm"
          class="gap-1"
        >
          <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          送信
        </Button>
        <Button 
          @click="cancelRating" 
          variant="outline" 
          size="sm"
          :disabled="loading"
        >
          キャンセル
        </Button>
      </div>

      <!-- ヘルプテキスト -->
      <p v-if="!currentRating" class="text-xs text-muted-foreground">
        星をクリックして評価してください
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'

interface Props {
  /** 表示する評価値（読み取り専用モード用） */
  value?: number | null
  /** 評価数（読み取り専用モード用） */
  ratingCount?: number
  /** 評価数表示の有効/無効 */
  showCount?: boolean
  /** 読み取り専用モード */
  readonly?: boolean
  /** 無効状態 */
  disabled?: boolean
  /** クイズセットID（評価送信用） */
  quizSetId?: string
  /** 自分が作成者かどうか */
  isOwn?: boolean
}

interface Emits {
  (e: 'submit', rating: number): void
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  ratingCount: 0,
  showCount: false,
  readonly: false,
  disabled: false,
  isOwn: false
})

const emit = defineEmits<Emits>()

// State
const currentRating = ref<number>(0)
const hoveredRating = ref<number>(0)
const loading = ref<boolean>(false)

// Computed
const displayRating = computed(() => {
  if (props.readonly) {
    return props.value || 0
  }
  return hoveredRating.value || currentRating.value
})

const canRate = computed(() => {
  return !props.readonly && !props.disabled && !props.isOwn
})

// Methods
function getStarDisplayClass(index: number): string {
  const rating = props.value || 0
  const isFilled = index < Math.floor(rating)
  const isHalfFilled = index === Math.floor(rating) && rating % 1 >= 0.5
  
  if (isFilled || isHalfFilled) {
    return 'text-yellow-400'
  }
  return 'text-gray-300'
}

function getStarInputClass(index: number): string {
  if (props.disabled || loading.value) {
    return 'text-gray-300 cursor-not-allowed'
  }
  
  const rating = displayRating.value
  if (index < rating) {
    return 'text-yellow-400 hover:text-yellow-500 cursor-pointer'
  }
  return 'text-gray-300 hover:text-yellow-400 cursor-pointer'
}

function handleStarClick(rating: number): void {
  if (!canRate.value || loading.value) return
  
  if (props.isOwn) {
    toast.warning('自分が作成したクイズセットには評価できません')
    return
  }
  
  currentRating.value = rating
}

async function submitRating(): Promise<void> {
  if (!canRate.value || currentRating.value === 0) return
  
  loading.value = true
  
  try {
    emit('submit', currentRating.value)
    toast.success(`${currentRating.value}つ星で評価しました`)
    currentRating.value = 0
  } catch (error) {
    console.error('Rating submission error:', error)
    toast.error('評価の送信に失敗しました')
  } finally {
    loading.value = false
  }
}

function cancelRating(): void {
  currentRating.value = 0
  hoveredRating.value = 0
}

// 自分が作成者の場合は説明を表示
watch(() => props.isOwn, (isOwn) => {
  if (isOwn && currentRating.value > 0) {
    currentRating.value = 0
  }
}, { immediate: true })
</script>

<style scoped>
.star-rating--readonly .text-yellow-400 {
  color: #fbbf24;
}

.star-rating--readonly .text-gray-300 {
  color: #d1d5db;
}
</style>