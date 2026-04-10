<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useStoriesStore } from "@/stores/stories";
import StoryCarousel from "@/components/StoryCarousel.vue";
import { assetUrl } from "@/utils/url";

const storiesStore = useStoriesStore();

const progress = ref(0);
const progressInterval = ref(null);
const STORY_DURATION = 5000; // 5 секунд

const currentStory = computed(() => {
  const story = storiesStore.currentStory;
  return story;
});
const currentUsername = computed(() => {
  const username = storiesStore.currentUsername;
  return username;
});

// Текущий пользователь
const currentUser = computed(() => {
  if (!currentUsername.value) return null;
  const userStories = storiesStore.storiesFeed.find(
    (s) => s.user.username === currentUsername.value,
  );
  return userStories?.user || null;
});

// Текущие истории пользователя
const userStories = computed(() => {
  if (!currentUsername.value) return [];
  const userStories = storiesStore.storiesFeed.find(
    (s) => s.user.username === currentUsername.value,
  );
  return userStories?.stories || [];
});

// Индекс текущей истории
const currentIndex = computed(() => storiesStore.currentStoryIndex);

// Запуск прогресс-бара
function startProgress() {
  progress.value = 0;
  clearInterval(progressInterval.value);

  progressInterval.value = setInterval(() => {
    progress.value += 100 / (STORY_DURATION / 100);
    if (progress.value >= 100) {
      nextStory();
    }
  }, 100);
}

// Следующая история
function nextStory() {
  storiesStore.nextStory();
  startProgress();
}

// Предыдущая история
function prevStory() {
  storiesStore.prevStory();
  startProgress();
}

// Закрытие
function closeViewer() {
  storiesStore.closeViewer();
}

// Обработка клавиш
function handleKeydown(e) {
  if (e.key === "ArrowRight") nextStory();
  if (e.key === "ArrowLeft") prevStory();
  if (e.key === "Escape") closeViewer();
}

// Клик по истории
function handleStoryClick(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;

  if (x < rect.width / 2) {
    prevStory();
  } else {
    nextStory();
  }
}

// URL истории
const storyUrl = computed(() => {
  if (!currentStory.value) return "";
  const url = currentStory.value.image;
  return assetUrl(url, "");
});

// Хелпер для шаблона
function getAvatarUrl(avatar) {
  return assetUrl(avatar);
}

function handleImageError(url) {
  // Ошибка загрузки изображения
}

// Проверка, вертикальное ли изображение
const isVertical = ref(true);

function checkImageOrientation(img) {
  const ratio = img.naturalWidth / img.naturalHeight;
  isVertical.value = ratio <= 1;
}

function onImageLoad(e) {
  checkImageOrientation(e.target);
}

// Отметить как просмотренную
function markAsViewed() {
  if (currentUsername.value) {
    storiesStore.markAsViewed(currentUsername.value);
  }
}

// Следим за сменой истории
watch(currentStory, (newStory) => {
  if (newStory) {
    startProgress();
    // Отмечаем просмотр
    storiesStore.viewStory(newStory._id);
    markAsViewed();
  }
});

onMounted(() => {
  if (currentStory.value) {
    startProgress();
    storiesStore.viewStory(currentStory.value._id);
    markAsViewed();
  }
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  clearInterval(progressInterval.value);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <!-- Если открыта карусель - показываем её -->
  <StoryCarousel v-if="storiesStore.showCarousel" />

  <!-- Иначе показываем обычный просмотрщик -->
  <div v-else-if="currentStory && currentUser" class="story-viewer">
    <!-- Прогресс бары - по одной для каждой истории пользователя -->
    <div class="story-progress">
      <div
        v-for="(story, index) in userStories"
        :key="story._id"
        class="progress-segment"
        :class="{
          active: index === currentIndex,
          completed: index < currentIndex,
        }"
      >
        <div
          v-if="index === currentIndex"
          class="progress-fill"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>

    <!-- Заголовок -->
    <div class="story-header">
      <div class="story-user-info">
        <img
          :src="getAvatarUrl(currentUser.avatar)"
          :alt="currentUser.username"
          class="story-avatar"
        />
        <div class="user-details">
          <span class="story-username">{{ currentUser.username }}</span>
          <span class="story-time">{{
            new Date(currentStory.createdAt).toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            })
          }}</span>
        </div>
      </div>
      <button @click="closeViewer" class="close-btn">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- История -->
    <div class="story-content" @click="handleStoryClick">
      <img
        v-if="storyUrl"
        :src="storyUrl"
        :alt="'Story'"
        class="story-media"
        :class="{ horizontal: !isVertical }"
        @load="onImageLoad"
        @error="handleImageError(storyUrl)"
      />
      <div v-else class="no-image">Нет изображения</div>

      <!-- Навигация -->
      <div class="story-nav">
        <div class="nav-prev" @click.stop="prevStory"></div>
        <div class="nav-next" @click.stop="nextStory"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.story-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.story-progress {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  gap: 4px;
  z-index: 10;
}

.progress-segment {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-segment.active {
  background: rgba(255, 255, 255, 0.3);
}

.progress-segment.completed {
  background: white;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.1s linear;
}

.story-header {
  position: absolute;
  top: 30px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  padding-top: 20px;
}

.story-user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
}

.story-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.story-username {
  font-weight: 600;
  font-size: 14px;
}

.story-time {
  font-size: 12px;
  opacity: 0.7;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #000;
  z-index: 0;
}

.story-media {
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  max-width: 100%;
  position: relative;
  z-index: 0;
}

/* Для очень широких изображений (горизонтальных) */
.story-media.horizontal {
  max-height: 50vh;
}

.no-image {
  color: white;
  font-size: 18px;
}

.story-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 1;
}

.nav-prev,
.nav-next {
  flex: 1;
  cursor: pointer;
  background: transparent;
}
</style>
