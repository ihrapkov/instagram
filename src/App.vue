<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useStoriesStore } from '@/stores/stories'
import Sidebar from '@/components/Sidebar.vue'
import StoryViewer from '@/pages/StoryViewer.vue'

const authStore = useAuthStore()
const storiesStore = useStoriesStore()
const route = useRoute()

// Страницы без sidebar
const noSidebarRoutes = ['/login', '/register']
const showSidebar = computed(() => {
  return authStore.isAuthenticated && !noSidebarRoutes.includes(route.path)
})

// Показываем StoryViewer если открыта история
const showStoryViewer = computed(() => {
  return storiesStore.currentUsername != null
})
</script>

<template>
  <div v-if="showSidebar" style="display: flex;">
    <Sidebar />
    <div style="margin-left: 245px; width: 100%;" class="main-content">
      <RouterView />
    </div>
  </div>
  <div v-else class="main-content">
    <RouterView />
  </div>

  <!-- Story Viewer -->
  <StoryViewer v-if="showStoryViewer" />
</template>

<style>
/* Мобильная версия - отступ снизу для меню */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0 !important;
    margin-bottom: 60px;
  }
}
</style>
