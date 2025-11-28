<template>
  <div class="space-y-6">
    <!-- Hero skeleton -->
    <div v-if="showHero" class="rounded-2xl p-8 skeleton animate-shimmer relative overflow-hidden">
      <div class="flex items-center justify-between">
        <div class="flex-1 space-y-3">
          <div class="h-8 bg-white/20 rounded w-48"></div>
          <div class="h-5 bg-white/15 rounded w-64"></div>
          <div class="flex gap-4">
            <div class="h-4 bg-white/10 rounded w-24"></div>
            <div class="h-4 bg-white/10 rounded w-20"></div>
          </div>
        </div>
        <div class="h-12 bg-white/15 rounded-lg w-32"></div>
      </div>
    </div>

    <!-- Cards skeleton -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="n in cardCount" 
        :key="n"
        class="card-enhanced animate-shimmer relative overflow-hidden"
      >
        <div class="h-2 bg-gradient-primary/50"></div>
        <div class="p-6 space-y-4">
          <!-- Title and badge -->
          <div class="flex items-start justify-between">
            <div class="flex-1 space-y-2">
              <div class="h-6 bg-muted rounded w-3/4"></div>
              <div class="h-5 bg-muted rounded w-20"></div>
            </div>
            <div class="h-8 bg-muted rounded w-16"></div>
          </div>
          
          <!-- Description -->
          <div class="space-y-2">
            <div class="h-4 bg-muted rounded w-full"></div>
            <div class="h-4 bg-muted rounded w-4/5"></div>
            <div class="h-4 bg-muted rounded w-3/5"></div>
          </div>
          
          <!-- Stats -->
          <div class="flex gap-4">
            <div class="h-4 bg-muted rounded w-24"></div>
            <div class="h-4 bg-muted rounded w-20"></div>
          </div>
          
          <!-- Rating -->
          <div class="h-5 bg-muted rounded w-32"></div>
          
          <!-- Footer -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-muted rounded-full"></div>
              <div class="h-4 bg-muted rounded w-20"></div>
            </div>
            <div class="h-9 bg-muted rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  cardCount?: number;
  showHero?: boolean;
}

withDefaults(defineProps<Props>(), {
  cardCount: 6,
  showHero: true,
});
</script>