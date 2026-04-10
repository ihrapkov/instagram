<script setup>
import { ref, computed, onMounted } from "vue";
import { useStoriesStore } from "@/stores/stories";
import { useAuthStore } from "@/stores/auth";
import { storyAPI } from "@/api/axios";
import StoryCarousel from "@/components/StoryCarousel.vue";
import { assetUrl } from "@/utils/url";
import { notifyError } from "@/utils/notify";

const storiesStore = useStoriesStore();
const authStore = useAuthStore();

const loading = ref(true);
const fileInput = ref(null);
const carouselRef = ref(null);

// Карусель
const scrollPosition = ref(0);
const itemsPerPage = 9;
const itemWidth = 94; // 74px (avatar + label) + 20px (gap)

// Получаем истории из store
const storiesFeed = computed(() => storiesStore.storiesFeed);

// Текущий пользователь
const currentUser = computed(() => authStore.currentUser);

// Общее количество элементов
const totalItems = computed(() => storiesFeed.value.length + 1); // +1 для "Ваша история"

// Можно ли прокручивать
const canScrollLeft = computed(() => scrollPosition.value > 0);
const canScrollRight = computed(() => {
  const maxScroll = Math.max(0, totalItems.value - itemsPerPage);
  return scrollPosition.value < maxScroll;
});

// Загрузка историй
onMounted(async () => {
  if (authStore.isAuthenticated) {
    const result = await storiesStore.fetchStories();
    if (result.success) {
      loading.value = false;
    }
  }
});

// Прокрутка вправо
function scrollRight() {
  if (canScrollRight.value) {
    scrollPosition.value += itemsPerPage;
    if (carouselRef.value) {
      carouselRef.value.scrollBy({
        left: itemWidth * itemsPerPage,
        behavior: "smooth",
      });
    }
  }
}

// Прокрутка влево
function scrollLeft() {
  if (canScrollLeft.value) {
    scrollPosition.value -= itemsPerPage;
    if (carouselRef.value) {
      carouselRef.value.scrollBy({
        left: -itemWidth * itemsPerPage,
        behavior: "smooth",
      });
    }
  }
}

// Открытие истории
function openStory(username) {
  storiesStore.openStory(username, 0);
}

// Загрузка истории
function handleFileChange(event) {
  const files = Array.from(event.target.files);
  files.forEach((file) => {
    if (file && file.type.startsWith("image/")) {
      uploadStory(file);
    }
  });
}

async function uploadStory(file) {
  const formData = new FormData();
  formData.append("story", file);

  const result = await storiesStore.createStory(formData);

  if (result.success) {
    // Проверяем, есть ли уже истории текущего пользователя в ленте
    const currentUserId = authStore.currentUser?._id;
    const existingIndex = storiesStore.storiesFeed.findIndex(
      (s) => s.user._id === currentUserId,
    );

    if (existingIndex !== -1) {
      // Добавляем историю к существующим
      storiesStore.storiesFeed[existingIndex].stories.unshift(result.story);
    } else {
      // Добавляем в начало ленты
      storiesStore.storiesFeed.unshift({
        user: result.story.user,
        stories: [result.story],
      });
    }
  } else {
    notifyError(result.message);
  }

  // Очищаем input
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

const avatarUrl = (avatar) => {
  return assetUrl(avatar);
};

// Проверка, просмотрена ли история
const isStoryViewed = (username) => {
  return storiesStore.isStoryViewed(username);
};
</script>

<template>
  <div class="stories-wrapper">
    <div class="stories-container" ref="carouselRef">
      <!-- Кнопка добавления истории (первая) -->
      <div class="story-item" @click="fileInput?.click()">
        <div class="story-ring add-story">
          <div class="story-avatar-wrapper">
            <img
              :src="avatarUrl(currentUser?.avatar)"
              alt="Ваша история"
              class="story-avatar"
            />
            <button
              @click.stop="fileInput?.click()"
              class="add-story-button"
              title="Добавить историю"
            >
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
        <span class="story-label">Ваша история</span>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          @change="handleFileChange"
          hidden
        />
      </div>

      <!-- Истории других пользователей -->
      <div
        v-for="userStory in storiesFeed"
        :key="userStory.user._id"
        class="story-item"
        @click="openStory(userStory.user.username)"
      >
        <div
          :class="[
            'story-ring',
            { viewed: isStoryViewed(userStory.user.username) },
          ]"
        >
          <img
            :src="avatarUrl(userStory.user.avatar)"
            :alt="userStory.user.username"
            class="story-avatar"
          />
        </div>
        <span class="story-label">{{ userStory.user.username }}</span>
      </div>
    </div>

    <!-- Кнопки прокрутки -->
    <button
      v-if="canScrollLeft"
      class="carousel-btn carousel-btn-left"
      @click="scrollLeft"
    >
      <i class="fa-solid fa-chevron-left"></i>
    </button>
    <button
      v-if="canScrollRight"
      class="carousel-btn carousel-btn-right"
      @click="scrollRight"
    >
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  </div>
</template>

<style scoped>
.stories-wrapper {
  position: relative;
  width: 100%;
  max-width: 930px;
  margin: 0 auto;
}

.stories-container {
  background: white;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  gap: 16px;
  overflow-x: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
}

.stories-container::-webkit-scrollbar {
  display: none;
}

.story-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
  width: 74px;
}

.story-ring {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  padding: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

/* Градиент для непросмотренных историй */
.story-ring:not(.add-story):not(.viewed) {
  background: linear-gradient(
    45deg,
    #f09433 0%,
    #e6683c 25%,
    #dc2743 50%,
    #cc2366 75%,
    #bc1888 100%
  );
}

/* Серый для просмотренных историй */
.story-ring.viewed {
  background: #3a3b3c;
}

/* Серый для добавления истории */
.story-ring.add-story {
  background: #dbdbdb;
}

.story-item:hover .story-ring:not(.viewed) {
  transform: scale(1.05);
}

.story-avatar-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-avatar {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  background: white;
  display: block;
}

.add-story-button {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #0095f6;
  border: 2px solid white;
  color: white;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.add-story-button:hover {
  background: #0081d6;
}

.story-label {
  font-size: 12px;
  margin-top: 8px;
  max-width: 74px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #262626;
  text-align: center;
}

/* Кнопки карусели */
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.carousel-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: translateY(-50%) scale(1.1);
}

.carousel-btn-left {
  left: 8px;
}

.carousel-btn-right {
  right: 8px;
}
</style>
