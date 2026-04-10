<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { usePostsStore } from "@/stores/posts";
import { useAuthStore } from "@/stores/auth";
import Stories from "../components/Stories.vue";
import Card from "../components/Card.vue";

const postsStore = usePostsStore();
const authStore = useAuthStore();
const loading = ref(true);

const isAuthenticated = computed(() => authStore.isAuthenticated);

// Загружаем ленту при авторизации
async function loadFeed() {
  if (isAuthenticated.value) {
    const result = await postsStore.fetchFeed();
    loading.value = false;

    if (!result.success) {
      console.error(result.message);
    }
  }
}

onMounted(() => {
  // Проверяем авторизацию при монтировании
  if (isAuthenticated.value) {
    loadFeed();
  }
});

// Следим за изменением авторизации
watch(isAuthenticated, (newValue) => {
  if (newValue && postsStore.feed.length === 0) {
    loadFeed();
  }
});

// Обработка удаления поста
function handlePostDeleted(postId) {
  postsStore.feed = postsStore.feed.filter((post) => post._id !== postId);
}
</script>

<template>
  <div class="content-wrapper">
    <div class="content">
      <Stories />
      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="postsStore.allPosts.length === 0" class="no-posts">
        Нет постов в ленте
      </div>
      <Card
        v-for="post in postsStore.allPosts"
        :key="post._id"
        :post="post"
        @post-deleted="handlePostDeleted"
      />
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}

.content {
  display: flex;
  align-items: center;
  justify-content: start;
  flex-direction: column;
  width: 100%;
  max-width: 640px;
  overflow: hidden;
}

.loading,
.no-posts {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>
