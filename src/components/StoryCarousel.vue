<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useStoriesStore } from "@/stores/stories";
import { useAuthStore } from "@/stores/auth";
import { assetUrl } from "@/utils/url";

const storiesStore = useStoriesStore();
const authStore = useAuthStore();

const carouselContainer = ref(null);
const currentIndex = ref(0);

// Текущий пользователь
const currentUser = computed(() => authStore.currentUser);

// Все истории пользователя
const userStories = computed(() => {
  return storiesStore.storiesFeed.find(
    (s) => s.user.username === storiesStore.currentUsername,
  );
});

// Все пользователи с историями
const usersWithStories = computed(() => storiesStore.storiesFeed);

// Текущий пользователь в карусели
const currentUserStory = computed(() => {
  if (!userStories.value) return null;
  return userStories.value.user;
});

// Истории текущего пользователя
const stories = computed(() => {
  if (!userStories.value) return [];
  return userStories.value.stories;
});

// Можно ли прокручивать
const canGoPrev = computed(() => currentIndex.value > 0);
const canGoNext = computed(() => currentIndex.value < stories.value.length - 1);

// URL истории
const storyUrl = computed(() => {
  if (!stories.value[currentIndex.value]) return "";
  const url = stories.value[currentIndex.value].image;
  return assetUrl(url, "");
});

// Хелпер для шаблона
function getAvatarUrl(avatar) {
  return assetUrl(avatar);
}

// Переход к следующей истории
function nextStory() {
  if (canGoNext.value) {
    currentIndex.value++;
    markAsViewed();
  } else {
    // Закрываем карусель
    closeCarousel();
  }
}

// Переход к предыдущей истории
function prevStory() {
  if (canGoPrev.value) {
    currentIndex.value--;
    markAsViewed();
  }
}

// Отметить как просмотренную
function markAsViewed() {
  if (currentUserStory.value) {
    storiesStore.markAsViewed(currentUserStory.value.username);
  }
}

// Закрытие карусели
function closeCarousel() {
  storiesStore.closeViewer();
}

// Обработка клавиш
function handleKeydown(e) {
  if (e.key === "ArrowRight") nextStory();
  if (e.key === "ArrowLeft") prevStory();
  if (e.key === "Escape") closeCarousel();
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
  markAsViewed();
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div v-if="userStories" class="story-carousel-overlay" @click="closeCarousel">
    <div class="story-carousel-content" @click.stop>
      <!-- Кнопка закрытия -->
      <button @click="closeCarousel" class="close-btn">
        <i class="fa-solid fa-xmark"></i>
      </button>

      <!-- Информация о пользователе -->
      <div class="user-info">
        <img
          :src="getAvatarUrl(currentUserStory?.avatar)"
          :alt="currentUserStory?.username"
          class="user-avatar"
        />
        <span class="username">{{ currentUserStory?.username }}</span>
      </div>

      <!-- Контейнер карусели -->
      <div class="carousel-wrapper">
        <!-- Кнопка влево -->
        <button
          v-if="canGoPrev"
          @click="prevStory"
          class="nav-btn nav-btn-left"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>

        <!-- Изображение истории -->
        <div class="story-image-container">
          <img
            v-if="storyUrl"
            :src="storyUrl"
            :alt="'Story'"
            class="story-image"
          />
          <div v-else class="no-image">Нет изображения</div>
        </div>

        <!-- Кнопка вправо -->
        <button
          v-if="canGoNext"
          @click="nextStory"
          class="nav-btn nav-btn-right"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <!-- Индикаторы историй -->
      <div class="story-indicators">
        <div
          v-for="(story, index) in stories"
          :key="story._id"
          :class="['indicator', { active: index === currentIndex }]"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.story-carousel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-carousel-content {
  position: relative;
  width: 600px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.close-btn {
  position: absolute;
  top: -50px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 32px;
  cursor: pointer;
  padding: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-weight: 600;
  font-size: 16px;
}

.carousel-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 20px;
}

.story-image-container {
  width: 600px;
  height: 440px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.no-image {
  color: white;
  font-size: 18px;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.story-indicators {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.2s;
}

.indicator.active {
  background: white;
  width: 24px;
  border-radius: 4px;
}
</style>
