<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { usePostsStore } from "@/stores/posts";
import "cssgram/source/css/cssgram.min.css";

const router = useRouter();
const postsStore = usePostsStore();

// Состояние шагов
const currentStep = ref(1);

// Состояние загрузки
const selectedFile = ref(null);
const previewUrl = ref(null);

// Состояние изображения
const imageScale = ref(1);
const imagePosition = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const showGrid = ref(false);
const aspectRatio = ref("original");
const imageContainer = ref(null);

// Попапы инструментов
const showZoomSlider = ref(false);
const showAspectPopup = ref(false);

// Состояние фильтров
const selectedFilter = ref("");
const filterIntensity = ref(100); // Сила фильтра 0-100%

// Состояние публикации
const caption = ref("");
const location = ref("");
const geolocationData = ref(null);
const isUploading = ref(false);
const error = ref("");
const geoLoading = ref(false);

// Таймер для долгого нажатия
let longPressTimer = null;
const LONG_PRESS_DURATION = 200;

// Доступные фильтры (CSSgram)
const filters = ref([
  { name: "Оригинал", value: "" },
  { name: "Clarendon", value: "clarendon" },
  { name: "Gingham", value: "gingham" },
  { name: "Moon", value: "moon" },
  { name: "Lark", value: "lark" },
  { name: "Reyes", value: "reyes" },
  { name: "Juno", value: "juno" },
  { name: "Slumber", value: "slumber" },
  { name: "Crema", value: "crema" },
  { name: "Ludwig", value: "ludwig" },
  { name: "Aden", value: "aden" },
]);

// Варианты соотношения сторон
const aspectRatios = [
  { label: "Оригинал", value: "original" },
  { label: "1:1", value: "1:1" },
  { label: "4:5", value: "4:5" },
  { label: "16:9", value: "16:9" },
];

// Вычисленные стили для изображения
const imageStyle = computed(() => {
  return {
    transform: `scale(${imageScale.value}) translate(${imagePosition.value.x}px, ${imagePosition.value.y}px)`,
    cursor: isDragging.value ? "grabbing" : "default",
    transition: isDragging.value ? "none" : "transform 0.15s ease-out",
  };
});

// Вычисленное соотношение сторон
const aspectRatioClass = computed(() => {
  switch (aspectRatio.value) {
    case "1:1":
      return "aspect-1-1";
    case "4:5":
      return "aspect-4-5";
    case "16:9":
      return "aspect-16-9";
    default:
      return "aspect-original";
  }
});

// Обработка выбора файла
function handleFileChange(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith("image/")) {
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
    error.value = "";
    currentStep.value = 1;
    imageScale.value = 1;
    imagePosition.value = { x: 0, y: 0 };
    aspectRatio.value = "original";
    selectedFilter.value = "";
    filterIntensity.value = 100;
  }
}

// Drag and drop
function handleDrop(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
    error.value = "";
    currentStep.value = 1;
  }
}

function handleDragOver(event) {
  event.preventDefault();
}

// Управление масштабом от центра
function handleZoomInput(event) {
  const newScale = parseFloat(event.target.value);
  imageScale.value = newScale;
  // При масштабировании от центра позиция не меняется
  imagePosition.value = { x: 0, y: 0 };
}

// Переключение попапа зума
function toggleZoomSlider() {
  showZoomSlider.value = !showZoomSlider.value;
  showAspectPopup.value = false;
}

// Переключение попапа пропорций
function toggleAspectPopup() {
  showAspectPopup.value = !showAspectPopup.value;
  showZoomSlider.value = false;
}

// Установка соотношения сторон
function setAspectRatio(ratio) {
  aspectRatio.value = ratio;
  showAspectPopup.value = false;
}

// Долгое нажатие и перетаскивание
function handleMouseDown(event) {
  longPressTimer = setTimeout(() => {
    showGrid.value = true;
    isDragging.value = true;
    dragStart.value = {
      x: event.clientX - imagePosition.value.x,
      y: event.clientY - imagePosition.value.y,
    };
  }, LONG_PRESS_DURATION);
}

function handleMouseMove(event) {
  if (!isDragging.value) return;
  event.preventDefault();
  imagePosition.value = {
    x: event.clientX - dragStart.value.x,
    y: event.clientY - dragStart.value.y,
  };
}

function handleMouseUp() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  isDragging.value = false;
  showGrid.value = false;
}

// Закрытие попапов при клике вне
function handleClickOutside(event) {
  const zoomSlider = document.querySelector(".zoom-slider-popup");
  const zoomBtn = document.querySelector(".zoom-btn");
  const aspectPopup = document.querySelector(".aspect-popup");
  const aspectBtn = document.querySelector(".aspect-btn");

  if (showZoomSlider.value && zoomSlider && zoomBtn) {
    if (!zoomSlider.contains(event.target) && !zoomBtn.contains(event.target)) {
      showZoomSlider.value = false;
    }
  }

  if (showAspectPopup.value && aspectPopup && aspectBtn) {
    if (
      !aspectPopup.contains(event.target) &&
      !aspectBtn.contains(event.target)
    ) {
      showAspectPopup.value = false;
    }
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  if (longPressTimer) clearTimeout(longPressTimer);
});

// Переход к следующему шагу
function nextStep() {
  if (currentStep.value === 1) currentStep.value = 2;
  else if (currentStep.value === 2) currentStep.value = 3;
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--;
}

// Получение геопозиции
async function getGeolocation() {
  if (!navigator.geolocation) {
    error.value = "Геолокация не поддерживается вашим браузером";
    return;
  }

  error.value = "";
  geoLoading.value = true;

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000,
      });
    });

    const lat = Math.round(position.coords.latitude * 1000000) / 1000000;
    const lng = Math.round(position.coords.longitude * 1000000) / 1000000;

    geolocationData.value = { latitude: lat, longitude: lng };
    location.value = `${lat}, ${lng}`;
  } catch (err) {
    console.error("Geolocation error:", err);
    if (err.code === 1)
      error.value =
        "Доступ к геолокации запрещен. Разрешите в настройках браузера.";
    else if (err.code === 2)
      error.value = "Не удалось определить местоположение.";
    else if (err.code === 3)
      error.value = "Превышено время ожидания. Попробуйте снова.";
    else error.value = "Не удалось получить геопозицию";
  } finally {
    geoLoading.value = false;
  }
}

function removeGeolocation() {
  geolocationData.value = null;
  location.value = "";
}

// Публикация поста
async function sharePost() {
  if (!selectedFile.value) return;

  isUploading.value = true;
  error.value = "";

  const formData = new FormData();
  formData.append("image", selectedFile.value);
  if (caption.value) formData.append("caption", caption.value);
  if (location.value) formData.append("location", location.value);

  const result = await postsStore.createPost(formData);
  isUploading.value = false;

  if (result.success) {
    cleanup();
    router.push("/");
  } else {
    error.value = result.message;
  }
}

function cleanup() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  selectedFile.value = null;
  previewUrl.value = null;
  caption.value = "";
  location.value = "";
  imageScale.value = 1;
  imagePosition.value = { x: 0, y: 0 };
  showGrid.value = false;
  aspectRatio.value = "original";
  selectedFilter.value = "";
  filterIntensity.value = 100;
  error.value = "";
  currentStep.value = 1;
  showZoomSlider.value = false;
  showAspectPopup.value = false;
  geolocationData.value = null;
  geoLoading.value = false;
}

function cancelCreation() {
  cleanup();
  router.push("/");
}
</script>

<template>
  <div class="create-page">
    <div class="create-container">
      <!-- Шапка -->
      <div class="create-header">
        <button @click="cancelCreation" class="cancel-btn">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <h2>Создание публикации</h2>
        <button
          v-if="currentStep < 3 && previewUrl"
          @click="nextStep"
          class="next-btn"
        >
          Далее
        </button>
        <button
          v-else-if="currentStep === 3 && previewUrl"
          @click="sharePost"
          :disabled="!selectedFile || isUploading"
          class="share-btn"
        >
          {{ isUploading ? "Публикация..." : "Поделиться" }}
        </button>
      </div>

      <!-- Шаг 1: Загрузка фото -->
      <div v-if="currentStep === 1" class="step-content">
        <div
          v-if="!previewUrl"
          class="upload-area"
          @drop="handleDrop"
          @dragover="handleDragOver"
        >
          <div class="upload-content">
            <i class="fa-regular fa-images upload-icon"></i>
            <h3>Перетащите фото и видео сюда</h3>
            <label class="select-file-btn">
              Выбрать с компьютера
              <input
                type="file"
                accept="image/*"
                @change="handleFileChange"
                hidden
              />
            </label>
          </div>
        </div>

        <div v-else class="image-editor">
          <!-- Контейнер изображения -->
          <div
            class="image-container"
            :class="aspectRatioClass"
            ref="imageContainer"
          >
            <img
              :src="previewUrl"
              alt="Preview"
              class="editable-image"
              :style="imageStyle"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseUp"
            />
            <!-- Сетка 3x3 -->
            <div v-if="showGrid" class="grid-overlay">
              <div class="grid-line grid-h-1"></div>
              <div class="grid-line grid-h-2"></div>
              <div class="grid-line grid-v-1"></div>
              <div class="grid-line grid-v-2"></div>
            </div>

            <!-- Кнопки управления в левом нижнем углу -->
            <div class="image-controls">
              <!-- Кнопка зума -->
              <button
                @click.stop="toggleZoomSlider"
                class="control-btn zoom-btn"
                :class="{ active: showZoomSlider }"
                title="Масштаб"
              >
                <i class="fa-solid fa-magnifying-glass"></i>
              </button>

              <!-- Ползунок зума -->
              <div v-if="showZoomSlider" class="zoom-slider-popup" @click.stop>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  :value="imageScale"
                  @input="handleZoomInput"
                  class="zoom-slider"
                />
                <span class="zoom-value"
                  >{{ Math.round(imageScale * 100) }}%</span
                >
              </div>

              <!-- Кнопка формата -->
              <button
                @click.stop="toggleAspectPopup"
                class="control-btn aspect-btn"
                :class="{ active: showAspectPopup }"
                title="Формат"
              >
                <i class="fa-solid fa-crop-simple"></i>
              </button>

              <!-- Попап с форматами -->
              <div v-if="showAspectPopup" class="aspect-popup" @click.stop>
                <button
                  v-for="ratio in aspectRatios"
                  :key="ratio.value"
                  @click="setAspectRatio(ratio.value)"
                  class="aspect-option"
                  :class="{ active: aspectRatio === ratio.value }"
                >
                  <div
                    class="aspect-icon"
                    :class="`aspect-icon-${ratio.value.replace(':', '\\:')}`"
                  ></div>
                  <span>{{ ratio.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Шаг 2: Фильтры -->
      <div v-else-if="currentStep === 2" class="step-content">
        <div class="filters-step">
          <div class="preview-with-filter">
            <!-- Фильтрованное изображение -->
            <img
              v-if="selectedFilter"
              :src="previewUrl"
              alt="Preview"
              class="filter-preview"
              :class="selectedFilter"
            />
            <!-- Оригинальное изображение с opacity для регулировки силы фильтра -->
            <img
              v-if="selectedFilter && filterIntensity < 100"
              :src="previewUrl"
              alt="Preview"
              class="filter-preview filter-original"
              :style="{ opacity: (100 - filterIntensity) / 100 }"
            />
            <!-- Просто оригинал если фильтр не выбран -->
            <img
              v-if="!selectedFilter"
              :src="previewUrl"
              alt="Preview"
              class="filter-preview"
            />
          </div>

          <!-- Ползунок интенсивности фильтра -->
          <div v-if="selectedFilter" class="intensity-control">
            <label>
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              Интенсивность: {{ filterIntensity }}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              v-model.number="filterIntensity"
              class="intensity-slider"
            />
          </div>

          <div class="filters-list">
            <button
              v-for="filter in filters"
              :key="filter.value"
              @click="selectedFilter = filter.value"
              class="filter-item"
              :class="{ active: selectedFilter === filter.value }"
            >
              <img :src="previewUrl" :class="filter.value" alt="filter.name" />
              <span>{{ filter.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Шаг 3: Описание и публикация -->
      <div v-else-if="currentStep === 3" class="step-content">
        <div class="publish-step">
          <div class="publish-preview">
            <img
              :src="previewUrl"
              alt="Preview"
              class="publish-image"
              :class="selectedFilter"
            />
          </div>
          <div class="publish-details">
            <div class="caption-input">
              <textarea
                v-model="caption"
                placeholder="Добавьте подпись..."
                rows="4"
                maxlength="2200"
              ></textarea>
              <div class="char-count">{{ caption.length }}/2200</div>
            </div>

            <div class="location-section">
              <div class="location-input-wrapper">
                <input
                  v-model="location"
                  type="text"
                  placeholder="Добавьте место"
                  class="location-input"
                />
                <button
                  @click="getGeolocation"
                  class="geo-btn-inside"
                  :disabled="geoLoading"
                  title="Использовать мою геопозицию"
                >
                  <i
                    v-if="!geoLoading"
                    class="fa-solid fa-location-crosshairs"
                  ></i>
                  <i v-else class="fa-solid fa-spinner fa-spin"></i>
                </button>
              </div>
              <div v-if="geolocationData" class="geo-info">
                <i class="fa-solid fa-check"></i>
                <span
                  >{{ geolocationData.latitude }},
                  {{ geolocationData.longitude }}</span
                >
                <button @click="removeGeolocation" class="geo-remove">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <p v-if="error" class="error-message">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Навигация -->
      <div v-if="previewUrl && currentStep > 1" class="navigation">
        <button @click="prevStep" class="back-btn">
          <i class="fa-solid fa-arrow-left"></i> Назад
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #fafafa;
}

.create-container {
  width: 100%;
  max-width: 900px;
  background: white;
  border: 1px solid #dbdbdb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.create-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #dbdbdb;
}

.create-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.cancel-btn,
.share-btn,
.next-btn {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  transition: background 0.2s;
}

.cancel-btn {
  color: #262626;
}
.cancel-btn:hover {
  background: #f5f5f5;
}
.share-btn,
.next-btn {
  color: #0095f6;
}
.share-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.share-btn:hover:not(:disabled),
.next-btn:hover {
  background: #f0f8ff;
}

/* Шаг */
.step-content {
  min-height: 500px;
}

/* Загрузка */
.upload-area {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  padding: 40px;
}

.upload-content {
  text-align: center;
}
.upload-icon {
  font-size: 80px;
  color: #dbdbdb;
  margin-bottom: 20px;
}
.upload-content h3 {
  font-size: 22px;
  font-weight: 300;
  margin: 0 0 20px;
  color: #262626;
}

.select-file-btn {
  display: inline-block;
  padding: 12px 24px;
  background: #0095f6;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.select-file-btn:hover {
  background: #0081d6;
}

/* Редактор изображения */
.image-editor {
  padding: 0;
}

.image-container {
  position: relative;
  width: 100%;
  height: 500px;
  overflow: hidden;
  background: #000;
}

.image-container.aspect-1-1 {
  height: 600px;
  aspect-ratio: 1 / 1;
}
.image-container.aspect-4-5 {
  height: 600px;
  aspect-ratio: 4 / 5;
}
.image-container.aspect-16-9 {
  height: 400px;
  aspect-ratio: 16 / 9;
}
.image-container.aspect-original {
  height: 500px;
}

.editable-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}

/* Сетка */
.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}
.grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.5);
}
.grid-h-1 {
  top: 33.33%;
  left: 0;
  right: 0;
  height: 1px;
}
.grid-h-2 {
  top: 66.66%;
  left: 0;
  right: 0;
  height: 1px;
}
.grid-v-1 {
  left: 33.33%;
  top: 0;
  bottom: 0;
  width: 1px;
}
.grid-v-2 {
  left: 66.66%;
  top: 0;
  bottom: 0;
  width: 1px;
}

/* Кнопки управления */
.image-controls {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.control-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.control-btn.active {
  background: rgba(0, 149, 246, 0.7);
}

/* Попап зума */
.zoom-slider-popup {
  position: absolute;
  bottom: 50px;
  left: 0;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  min-width: 180px;
  backdrop-filter: blur(8px);
}

.zoom-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 2px solid #0095f6;
}

.zoom-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 2px solid #0095f6;
}

.zoom-value {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

/* Попап форматов */
.aspect-popup {
  position: absolute;
  bottom: 50px;
  left: 50px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  gap: 8px;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.aspect-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.aspect-option:hover {
  background: rgba(255, 255, 255, 0.1);
}
.aspect-option.active {
  background: rgba(0, 149, 246, 0.5);
}

.aspect-icon {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 4px;
}

.aspect-option.active .aspect-icon {
  border-color: white;
}
.aspect-icon-original {
  width: 32px;
  height: 24px;
}
.aspect-icon-1\\:1 {
  width: 28px;
  height: 28px;
}
.aspect-icon-4\\:5 {
  width: 24px;
  height: 30px;
}
.aspect-icon-16\\:9 {
  width: 36px;
  height: 20px;
}

.aspect-option span {
  font-size: 11px;
  font-weight: 500;
}

/* Шаг фильтров */
.filters-step {
  padding: 20px;
}
.preview-with-filter {
  width: 100%;
  max-height: 400px;
  overflow: hidden;
  background: #000;
  border-radius: 8px;
  margin-bottom: 20px;
}
.filter-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: relative;
}

.filter-original {
  position: absolute;
  top: 0;
  left: 0;
}

/* Интенсивность фильтра */
.intensity-control {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 0;
  margin-bottom: 8px;
}

.intensity-control label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.intensity-control label i {
  color: #0095f6;
}

.intensity-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, #dbdbdb 0%, #0095f6 100%);
  border-radius: 3px;
  outline: none;
}

.intensity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0095f6;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s;
}

.intensity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.intensity-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0095f6;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
.filters-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 12px 0;
}
.filter-item {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-item:hover {
  background: #f5f5f5;
}
.filter-item.active {
  border-color: #0095f6;
  background: #f0f8ff;
}
.filter-item img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}
.filter-item span {
  font-size: 12px;
  font-weight: 500;
}

/* CSSgram фильтры подключены через import */

/* Шаг публикации */
.publish-step {
  display: flex;
  gap: 20px;
  padding: 20px;
}
.publish-preview {
  flex: 1;
  max-width: 400px;
}
.publish-image {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}
.publish-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.caption-input {
  position: relative;
}
.caption-input textarea {
  width: 100%;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}
.caption-input textarea:focus {
  border-color: #0095f6;
}
.char-count {
  text-align: right;
  font-size: 12px;
  color: #8e8e8e;
  margin-top: 4px;
}

.location-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.location-input {
  width: 100%;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  padding: 12px 45px 12px 12px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}
.location-input:focus {
  border-color: #0095f6;
}

.geo-btn-inside {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: #0095f6;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.geo-btn-inside:hover {
  background: #f0f8ff;
}
.geo-btn-inside:disabled {
  opacity: 0.5;
}

.geo-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #e8f5e9;
  border-radius: 8px;
  color: #2e7d32;
  font-size: 14px;
  font-weight: 500;
}
.geo-info span {
  flex: 1;
}

.geo-remove {
  padding: 4px 8px;
  border: none;
  background: none;
  color: #ed4956;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}
.geo-remove:hover {
  background: rgba(237, 73, 86, 0.1);
}

.error-message {
  color: #ed4956;
  font-size: 14px;
  margin: 0;
}

/* Навигация */
.navigation {
  padding: 16px 20px;
  border-top: 1px solid #dbdbdb;
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}
.back-btn:hover {
  background: #f5f5f5;
}

/* Адаптивность */
@media (max-width: 768px) {
  .publish-step {
    flex-direction: column;
  }
  .publish-preview {
    max-width: 100%;
  }
}
</style>
