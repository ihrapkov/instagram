<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

// Получаем username из параметра маршрута
const username = ref(route.params.username || "user");

let autoScrollInterval;

// Пример данных для слайдов (ссылки на изображения)
const stories = ref([
  "/img/foto.jpg",
  "/img/foto.jpg",
  "/img/foto.jpg",
  "/img/foto.jpg",
]);

// Реактивные переменные
const currentIndex = ref(0);
const currentTranslate = ref(0);

// Ширина одного слайда
const slideWidth = 500;

// Обработчик вращения колесика мыши
function handleWheel(event) {
  if (event.deltaY > 0) {
    nextSlide();
  } else {
    prevSlide();
  }
}

// Переход к следующему слайду
function nextSlide() {
  if (currentIndex.value < stories.value.length - 1) {
    currentIndex.value++;
    currentTranslate.value = -currentIndex.value * slideWidth;
  }
}

// Переход к предыдущему слайду
function prevSlide() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    currentTranslate.value = -currentIndex.value * slideWidth;
  }
}

// Закрытие истории
function closeStory() {
  router.push("/");
}

// Обработка клавиш
function handleKeydown(event) {
  if (event.key === "Escape") {
    closeStory();
  } else if (event.key === "ArrowRight") {
    nextSlide();
  } else if (event.key === "ArrowLeft") {
    prevSlide();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
  }
});
</script>
<template>
  <div class="carousel-wrap">
    <div class="carousel-container" @wheel="handleWheel">
      <!-- Список слайдов -->
      <div
        class="slides"
        :style="{ transform: `translateX(${currentTranslate}px)` }"
      >
        <div
          v-for="(story, index) in stories"
          :key="index"
          class="slide"
          :style="{ backgroundImage: `url(${story})` }"
        ></div>
      </div>
    </div>
    <button @click="closeStory" class="btn">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <div class="story-username">{{ username }}</div>
  </div>
</template>

<style scoped>
.carousel-wrap {
  background: #353535;
  width: 100%;
  height: 100vh;
  position: relative;
}
.carousel-container {
  width: 500px;
  overflow: hidden;
  margin: 0 auto;
  position: relative;
}

.slides {
  display: flex;
  transition: transform 0.5s ease;
  margin-top: 10rem;
}

.slide {
  flex: 0 0 500px;
  height: 700px;
  background-size: cover;
  background-position: center;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(117, 117, 117, 0.2);
}

.carousel-container:hover {
  cursor: grab;
}
.btn {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #eee;
  color: #eee;
  background: none;
  cursor: pointer;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.story-username {
  position: absolute;
  left: 20px;
  top: 20px;
  color: white;
  font-size: 16px;
  font-weight: 600;
}
</style>
