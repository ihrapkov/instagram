<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { userAPI } from "@/api/axios";
import { assetUrl } from "@/utils/url";
import { notifyError } from "@/utils/notify";

const router = useRouter();
const authStore = useAuthStore();

const fileInput = ref(null);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");

// Данные формы
const formData = ref({
  username: "",
  fullName: "",
  bio: "",
  gender: "",
  email: "",
  newPassword: "",
  confirmPassword: "",
  avatar: "",
});

const bioCount = computed(() => formData.value.bio.length);
const bioLimit = 150;

const avatarUrl = computed(() => {
  return assetUrl(formData.value.avatar);
});

// Загрузка данных профиля
async function loadProfile() {
  loading.value = true;
  error.value = "";

  try {
    const username = authStore.currentUser?.username;
    const response = await userAPI.getProfile(username);
    const user = response.data.user;

    formData.value.username = user.username || "";
    formData.value.fullName = user.fullName || "";
    formData.value.bio = user.bio || "";
    formData.value.gender = user.gender || "";
    formData.value.email = user.email || "";
    formData.value.avatar = user.avatar || "";
  } catch (err) {
    error.value = err.response?.data?.message || "Ошибка загрузки профиля";
  } finally {
    loading.value = false;
  }
}

// Загрузка аватара
function handleFileChange(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith("image/")) {
    uploadAvatar(file);
  }
}

async function uploadAvatar(file) {
  const formDataUpload = new FormData();
  formDataUpload.append("avatar", file);

  try {
    const response = await userAPI.uploadAvatar(formDataUpload);
    formData.value.avatar = response.data.user.avatar;
  } catch (err) {
    console.error("Upload avatar error:", err);
    notifyError("Ошибка при загрузке аватара");
  }

  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

// Сохранение изменений
async function saveProfile() {
  saving.value = true;
  error.value = "";
  success.value = "";

  // Валидация
  if (
    formData.value.newPassword &&
    formData.value.newPassword !== formData.value.confirmPassword
  ) {
    error.value = "Пароли не совпадают";
    saving.value = false;
    return;
  }

  if (formData.value.bio.length > bioLimit) {
    error.value = `Графа "О себе" не должна превышать ${bioLimit} символов`;
    saving.value = false;
    return;
  }

  try {
    const updateData = {
      fullName: formData.value.fullName,
      bio: formData.value.bio,
      gender: formData.value.gender,
    };

    // Если меняется email
    if (
      formData.value.email &&
      formData.value.email !== authStore.currentUser?.email
    ) {
      updateData.email = formData.value.email;
    }

    // Если меняется пароль
    if (formData.value.newPassword) {
      updateData.password = formData.value.newPassword;
    }

    await userAPI.updateProfile(updateData);

    // Обновляем данные в хранилище
    if (authStore.user) {
      authStore.user.fullName = formData.value.fullName;
      authStore.user.bio = formData.value.bio;
      authStore.user.gender = formData.value.gender;
      if (formData.value.email) {
        authStore.user.email = formData.value.email;
      }
      localStorage.setItem("user", JSON.stringify(authStore.user));
    }

    success.value = "Изменения сохранены";

    // Перенаправляем на профиль через 1 секунду
    setTimeout(() => {
      router.push(`/profile/${formData.value.username}`);
    }, 1000);
  } catch (err) {
    error.value = err.response?.data?.message || "Ошибка при сохранении";
  } finally {
    saving.value = false;
  }
}

// Отмена
function cancel() {
  router.back();
}

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="edit-profile-page">
    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-else class="edit-profile-content">
      <div class="edit-profile-header">
        <button @click="cancel" class="back-btn">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1>Редактировать профиль</h1>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>

      <form @submit.prevent="saveProfile" class="edit-form">
        <!-- Аватар -->
        <div class="form-section">
          <div class="avatar-section">
            <img
              :src="avatarUrl"
              :alt="formData.username"
              class="avatar-preview"
            />
            <div class="avatar-actions">
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleFileChange"
                hidden
              />
              <button
                type="button"
                @click="fileInput?.click()"
                class="change-avatar-button"
              >
                Изменить фото
              </button>
            </div>
          </div>
        </div>

        <!-- Имя пользователя -->
        <div class="form-section">
          <label class="form-label">Имя пользователя</label>
          <input
            v-model="formData.username"
            type="text"
            disabled
            class="form-input disabled-input"
          />
          <span class="form-hint">Имя пользователя нельзя изменить</span>
        </div>

        <!-- Полное имя -->
        <div class="form-section">
          <label class="form-label" for="fullName">Полное имя</label>
          <input
            id="fullName"
            v-model="formData.fullName"
            type="text"
            class="form-input"
            maxlength="50"
          />
        </div>

        <!-- О себе -->
        <div class="form-section">
          <label class="form-label" for="bio">О себе</label>
          <textarea
            id="bio"
            v-model="formData.bio"
            class="form-textarea"
            :maxlength="bioLimit"
            rows="4"
            placeholder="Расскажите о себе..."
          ></textarea>
          <span :class="['char-count', { warning: bioCount > bioLimit * 0.8 }]">
            {{ bioCount }}/{{ bioLimit }}
          </span>
        </div>

        <!-- Пол -->
        <div class="form-section">
          <label class="form-label" for="gender">Пол</label>
          <select id="gender" v-model="formData.gender" class="form-select">
            <option value="">Не указан</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
        </div>

        <!-- Email -->
        <div class="form-section">
          <label class="form-label" for="email">Электронная почта</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            class="form-input"
            placeholder="your@email.com"
          />
        </div>

        <!-- Новый пароль -->
        <div class="form-section">
          <label class="form-label" for="newPassword">Новый пароль</label>
          <input
            id="newPassword"
            v-model="formData.newPassword"
            type="password"
            class="form-input"
            placeholder="Оставьте пустым, если не хотите менять"
          />
        </div>

        <!-- Подтверждение пароля -->
        <div class="form-section">
          <label class="form-label" for="confirmPassword"
            >Подтвердите пароль</label
          >
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            class="form-input"
            placeholder="Повторите новый пароль"
          />
        </div>

        <!-- Кнопка сохранения -->
        <div class="form-actions">
          <button type="submit" class="save-btn" :disabled="saving">
            {{ saving ? "Сохранение..." : "Сохранить" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.edit-profile-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 30px 20px;
  min-height: calc(100vh - 60px);
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.edit-profile-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.edit-profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #dbdbdb;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  font-size: 24px;
  color: #262626;
  border-radius: 4px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #fafafa;
}

.edit-profile-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.error-message {
  background: #ffebee;
  color: #e53935;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-section {
  padding: 20px 0;
  border-bottom: 1px solid #efefef;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-label {
  display: block;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  color: #262626;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dbdbdb;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
  background: white;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #a8a8a8;
}

.disabled-input {
  background: #fafafa;
  color: #8e8e8e;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-select {
  cursor: pointer;
}

.form-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #8e8e8e;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #8e8e8e;
  margin-top: 6px;
}

.char-count.warning {
  color: #e53935;
}

/* Аватар */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #dbdbdb;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-avatar-button {
  padding: 8px 16px;
  background: #0095f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.change-avatar-button:hover {
  background: #0081d6;
}

/* Кнопка сохранения */
.form-actions {
  margin-top: 30px;
  padding-top: 20px;
}

.save-btn {
  width: 100%;
  padding: 12px;
  background: #0095f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #0081d6;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Адаптивность */
@media (max-width: 768px) {
  .edit-profile-page {
    padding: 20px 15px;
  }

  .edit-profile-header h1 {
    font-size: 20px;
  }

  .avatar-section {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
