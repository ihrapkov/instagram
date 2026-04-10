<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { usePostsStore } from "@/stores/posts";
import { userAPI, postAPI, commentAPI } from "@/api/axios";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const postsStore = usePostsStore();

const fileInput = ref(null);

// Данные профиля
const profile = ref(null);
const posts = ref([]);
const loading = ref(true);
const error = ref("");
const isUploading = ref(false);

// Модальное окно подписчиков/подписок
const showFollowModal = ref(false);
const followModalType = ref("followers"); // 'followers' или 'following'

// Модальное окно просмотра поста
const showPostModal = ref(false);
const selectedPost = ref(null);
const commentText = ref("");

// Открытие модального окна поста
function openPostModal(post) {
  selectedPost.value = post;
  showPostModal.value = true;
  document.body.style.overflow = "hidden";
}

// Закрытие модального окна поста
function closePostModal() {
  showPostModal.value = false;
  selectedPost.value = null;
  commentText.value = "";
  document.body.style.overflow = "";
}

// Открытие модального окна подписчиков/подписок
function openFollowModal(type) {
  followModalType.value = type;
  showFollowModal.value = true;
}

// Закрытие модального окна
function closeFollowModal() {
  showFollowModal.value = false;
}

// Переход к профилю из модального окна
function goToProfileFromModal(username) {
  router.push(`/profile/${username}`);
  showFollowModal.value = false;
}

// Проверка, подписан ли на пользователя из модального окна
function isUserFollowing(userId) {
  return authStore.currentUser?.following?.some((id) => {
    const uid = typeof id === "string" ? id : id._id;
    return uid === userId;
  });
}

// Подписка из модального окна
async function toggleFollowFromModal(user) {
  try {
    if (isUserFollowing(user._id)) {
      await userAPI.unfollow(user._id);
    } else {
      await userAPI.follow(user._id);
    }
    // Обновляем локально список
    if (followModalType.value === "following") {
      // Если это список подписок, обновляем его
      if (!isUserFollowing(user._id)) {
        profile.value.following.push(user);
      } else {
        profile.value.following = profile.value.following.filter(
          (u) => u._id !== user._id,
        );
      }
    }
  } catch (err) {
    console.error("Follow error:", err);
  }
}

// Лайк поста
async function toggleLike(postId) {
  try {
    const isLiked = selectedPost.value.likes?.some(
      (like) => like._id === authStore.currentUser?._id,
    );
    if (isLiked) {
      await postAPI.unlike(postId);
      selectedPost.value.likes = selectedPost.value.likes.filter(
        (like) => like._id !== authStore.currentUser?._id,
      );
    } else {
      await postAPI.like(postId);
      selectedPost.value.likes.push({ _id: authStore.currentUser?._id });
    }
    // Обновляем в основном списке постов
    const postInList = posts.value.find((p) => p._id === postId);
    if (postInList) {
      postInList.likes = selectedPost.value.likes;
    }
  } catch (err) {
    console.error("Like error:", err);
  }
}

// Добавление комментария
async function addComment() {
  if (!commentText.value.trim() || !selectedPost.value) return;

  try {
    const response = await commentAPI.addComment(
      selectedPost.value._id,
      commentText.value,
    );
    selectedPost.value.comments = [
      ...(selectedPost.value.comments || []),
      response.data.comment,
    ];
    commentText.value = "";
  } catch (err) {
    console.error("Add comment error:", err);
  }
}

// Удаление комментария
async function deleteComment(commentId) {
  try {
    await commentAPI.deleteComment(commentId);
    selectedPost.value.comments = selectedPost.value.comments.filter(
      (c) => c._id !== commentId,
    );
  } catch (err) {
    console.error("Delete comment error:", err);
  }
}

// Время назад
function timeAgo(date) {
  const now = new Date();
  const created = new Date(date);
  const diffMs = now - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} мин.`;
  }
  if (diffHours < 24) return `${diffHours} ч.`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} д.`;
}

// Загрузка профиля
async function loadProfile() {
  loading.value = true;
  error.value = "";

  try {
    const username = route.params.username || authStore.currentUser?.username;
    const response = await userAPI.getProfile(username);
    profile.value = response.data.user;
    posts.value = response.data.posts || [];
  } catch (err) {
    error.value = err.response?.data?.message || "Ошибка загрузки профиля";
  } finally {
    loading.value = false;
  }
}

// Следим за изменением username в роуте
watch(
  () => route.params.username,
  () => {
    loadProfile();
  },
);

// Проверка, это текущий пользователь или нет
const isCurrentUser = computed(() => {
  const username = route.params.username || authStore.currentUser?.username;
  return username === authStore.currentUser?.username;
});

// Подписка/отписка
async function toggleFollow() {
  if (!profile.value) return;

  try {
    if (isCurrentUser.value) return;

    const isCurrentlyFollowing = profile.value.followers?.some(
      (f) => f._id === authStore.currentUser?._id,
    );

    if (isCurrentlyFollowing) {
      await userAPI.unfollow(profile.value._id);
      // Обновляем профиль
      profile.value.followers = profile.value.followers.filter(
        (f) => f._id !== authStore.currentUser?._id,
      );
      profile.value.followersCount--;
      // Обновляем текущего пользователя
      if (authStore.user) {
        authStore.user.following = authStore.user.following?.filter((id) => {
          const uid = typeof id === "string" ? id : id._id;
          return uid !== profile.value._id;
        });
        localStorage.setItem("user", JSON.stringify(authStore.user));
      }
    } else {
      await userAPI.follow(profile.value._id);
      // Обновляем профиль
      profile.value.followers.push({
        _id: authStore.currentUser?._id,
        username: authStore.currentUser?.username,
        avatar: authStore.currentUser?.avatar,
      });
      profile.value.followersCount++;
      // Обновляем текущего пользователя
      if (authStore.user) {
        authStore.user.following = [
          ...(authStore.user.following || []),
          profile.value._id,
        ];
        localStorage.setItem("user", JSON.stringify(authStore.user));
      }
    }
  } catch (err) {
    console.error("Follow error:", err);
    alert("Ошибка при подписке/отписке");
  }
}

const isFollowing = computed(() => {
  if (!profile.value || isCurrentUser.value) return false;
  return profile.value.followers?.some(
    (f) => f._id === authStore.currentUser?._id,
  );
});

const avatarUrl = computed(() => {
  if (!profile.value?.avatar) return "/img/foto.jpg";
  if (profile.value.avatar.startsWith("http")) return profile.value.avatar;
  return `http://localhost:5000${profile.value.avatar}`;
});

// Загрузка аватара
function handleFileChange(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith("image/")) {
    uploadAvatar(file);
  }
}

async function uploadAvatar(file) {
  isUploading.value = true;

  const formData = new FormData();
  formData.append("avatar", file);

  const result = await authStore.uploadAvatar(formData);

  isUploading.value = false;

  if (result.success) {
    // Обновляем профиль
    profile.value.avatar = result.avatar;
    // Перезагружаем профиль для обновления данных
    loadProfile();
  } else {
    alert(result.message);
  }

  // Очищаем input
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

// Удаление поста
async function handleDeletePost(postId) {
  if (!confirm("Вы уверены, что хотите удалить этот пост?")) return;

  const result = await postsStore.deletePost(postId);

  if (result.success) {
    posts.value = posts.value.filter((post) => post._id !== postId);
  } else {
    alert(result.message);
  }
}

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="profile-page">
    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="profile" class="profile-content">
      <div class="profile-header">
        <div class="profile-avatar-container">
          <img
            :src="avatarUrl"
            :alt="profile.username"
            class="profile-avatar"
          />
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFileChange"
            hidden
          />
          <button
            v-if="isCurrentUser"
            @click="fileInput?.click()"
            :disabled="isUploading"
            class="change-avatar-btn"
            title="Изменить аватар"
          >
            <i v-if="!profile.avatar" class="fa-solid fa-camera"></i>
            <i v-else class="fa-solid fa-camera"></i>
          </button>
        </div>
        <div class="profile-info">
          <div class="profile-top">
            <h1 class="profile-username">{{ profile.username }}</h1>
            <button
              v-if="isCurrentUser"
              class="edit-profile-btn"
              @click="router.push({ name: 'edit-profile' })"
            >
              Редактировать профиль
            </button>
            <button
              v-else
              :class="['follow-btn', { following: isFollowing }]"
              @click="toggleFollow"
            >
              {{ isFollowing ? "Вы подписаны" : "Подписаться" }}
            </button>
          </div>
          <div class="profile-stats">
            <span
              ><strong>{{ posts.length }}</strong> публикаций</span
            >
            <span class="clickable" @click="openFollowModal('followers')">
              <strong>{{ profile.followersCount || 0 }}</strong> подписчиков
            </span>
            <span class="clickable" @click="openFollowModal('following')">
              <strong>{{ profile.followingCount || 0 }}</strong> подписок
            </span>
          </div>
          <div class="profile-bio">
            <strong v-if="profile.fullName">{{ profile.fullName }}</strong>
            <p v-if="profile.bio">{{ profile.bio }}</p>
          </div>
        </div>
      </div>

      <div class="profile-nav">
        <div class="nav-item active">
          <i class="fa-solid fa-table-cells"></i>
          <span>ПУБЛИКАЦИИ</span>
        </div>
        <div class="nav-item">
          <i class="fa-solid fa-clapperboard"></i>
          <span>REELS</span>
        </div>
        <div class="nav-item">
          <i class="fa-regular fa-bookmark"></i>
          <span>СОХРАНЕННОЕ</span>
        </div>
      </div>

      <div class="profile-posts">
        <div
          v-for="post in posts"
          :key="post._id"
          class="post-item"
          @click="openPostModal(post)"
        >
          <img
            :src="
              post.image.startsWith('http')
                ? post.image
                : `http://localhost:5000${post.image}`
            "
            :alt="'Post ' + post._id"
          />
          <div class="post-overlay">
            <div class="post-stats">
              <span
                ><i class="fa-solid fa-heart"></i>
                {{ post.likes?.length || 0 }}</span
              >
              <span
                ><i class="fa-solid fa-comment"></i>
                {{ post.comments?.length || 0 }}</span
              >
            </div>
          </div>
          <button
            v-if="isCurrentUser"
            class="post-delete-btn"
            @click.stop="handleDeletePost(post._id)"
            title="Удалить пост"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        <div v-if="posts.length === 0" class="no-posts">
          <i class="fa-regular fa-face-sad-tear"></i>
          <h3>Пока нет публикаций</h3>
        </div>
      </div>
    </div>

    <!-- Модальное окно подписчиков/подписок -->
    <div v-if="showFollowModal" class="modal-overlay" @click="closeFollowModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>
            {{ followModalType === "followers" ? "Подписчики" : "Подписки" }}
          </h2>
          <button @click.stop="closeFollowModal" class="modal-close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-list">
          <div
            v-for="user in followModalType === 'followers'
              ? profile.followers
              : profile.following"
            :key="user._id"
            class="modal-list-item"
            @click.stop="goToProfileFromModal(user.username)"
          >
            <img
              :src="
                user.avatar
                  ? `http://localhost:5000${user.avatar}`
                  : '/img/foto.jpg'
              "
              :alt="user.username"
              class="modal-avatar"
            />
            <div class="modal-user-info">
              <span class="modal-username">{{ user.username }}</span>
            </div>
            <button
              v-if="user._id !== authStore.currentUser?._id"
              :class="[
                'modal-follow-btn',
                { following: isUserFollowing(user._id) },
              ]"
              @click.stop="toggleFollowFromModal(user)"
            >
              {{ isUserFollowing(user._id) ? "Вы подписаны" : "Подписаться" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно просмотра поста -->
    <div
      v-if="showPostModal"
      class="post-modal-overlay"
      @click="closePostModal"
    >
      <div class="post-modal-content" @click.stop>
        <button @click="closePostModal" class="post-modal-close">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="post-modal-body" v-if="selectedPost">
          <div class="post-modal-image">
            <img
              :src="
                selectedPost.image.startsWith('http')
                  ? selectedPost.image
                  : `http://localhost:5000${selectedPost.image}`
              "
              :alt="selectedPost.caption || 'Post'"
            />
          </div>
          <div class="post-modal-info">
            <div class="post-modal-header">
              <img
                :src="
                  selectedPost.user?.avatar
                    ? selectedPost.user.avatar.startsWith('http')
                      ? selectedPost.user.avatar
                      : `http://localhost:5000${selectedPost.user.avatar}`
                    : '/img/foto.jpg'
                "
                :alt="selectedPost.user?.username"
                class="post-modal-avatar"
              />
              <span class="post-modal-username">{{
                selectedPost.user?.username
              }}</span>
            </div>

            <div class="post-modal-actions">
              <button
                :class="[
                  'action-btn',
                  'like-btn',
                  {
                    liked: selectedPost.likes?.some(
                      (l) => l._id === authStore.currentUser?._id,
                    ),
                  },
                ]"
                @click="toggleLike(selectedPost._id)"
              >
                <i
                  :class="
                    selectedPost.likes?.some(
                      (l) => l._id === authStore.currentUser?._id,
                    )
                      ? 'fa-solid'
                      : 'fa-regular'
                  "
                ></i>
              </button>
              <button class="action-btn comment-btn">
                <i class="fa-regular fa-comment"></i>
              </button>
            </div>

            <div class="post-modal-likes">
              <strong>{{ selectedPost.likes?.length || 0 }}</strong> отметок
              "Нравится"
            </div>

            <div class="post-modal-caption" v-if="selectedPost.caption">
              <strong>{{ selectedPost.user?.username }}</strong>
              {{ selectedPost.caption }}
            </div>

            <div class="post-modal-comments">
              <div
                v-for="comment in selectedPost.comments"
                :key="comment._id"
                class="post-modal-comment"
              >
                <div class="comment-header">
                  <strong class="comment-username">{{
                    comment.user?.username
                  }}</strong>
                  <span class="comment-time" v-if="comment.createdAt">{{
                    timeAgo(comment.createdAt)
                  }}</span>
                </div>
                <p class="comment-text">{{ comment.text }}</p>
                <button
                  v-if="comment.user?._id === authStore.currentUser?._id"
                  class="delete-comment-btn"
                  @click="deleteComment(comment._id)"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>

            <div class="post-modal-add-comment">
              <input
                v-model="commentText"
                @keyup.enter="addComment"
                type="text"
                placeholder="Добавьте комментарий..."
                class="comment-input"
              />
              <button
                @click="addComment"
                :disabled="!commentText.trim()"
                class="submit-comment-btn"
              >
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 935px;
  margin: 0 auto;
  padding: 30px 20px;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  color: #ed4956;
}

.profile-content {
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

.profile-header {
  display: flex;
  gap: 30px;
  margin-bottom: 44px;
  padding-bottom: 44px;
  border-bottom: 1px solid #dbdbdb;
}

.profile-avatar-container {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #dbdbdb;
  padding: 5px;
}

.change-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: #0095f6;
  border: 2px solid white;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background 0.2s;
}

.change-avatar-btn:hover:not(:disabled) {
  background: #0081d6;
}

.change-avatar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.profile-info {
  flex: 1;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.profile-username {
  font-size: 28px;
  font-weight: 300;
  margin: 0;
}

.edit-profile-btn,
.follow-btn {
  padding: 5px 9px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.follow-btn {
  background: #0095f6;
  color: white;
}

.follow-btn:hover {
  background: #0081d6;
}

.follow-btn.following {
  background: #efefef;
  color: #262626;
}

.follow-btn.following:hover {
  background: #dbdbdb;
}

.edit-profile-btn {
  border: 1px solid #dbdbdb;
  background: #fafafa;
}

.edit-profile-btn:hover {
  background: #f0f0f0;
}

.profile-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
}

.profile-stats span {
  font-size: 16px;
}

.profile-stats .clickable {
  cursor: pointer;
  transition: color 0.2s;
}

.profile-stats .clickable:hover {
  color: #0095f6;
}

.profile-stats .clickable strong {
  cursor: pointer;
}

.profile-bio strong {
  display: block;
  margin-bottom: 4px;
}

.profile-bio p {
  margin: 0;
  font-size: 14px;
}

.profile-nav {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-bottom: 20px;
  border-top: 1px solid #dbdbdb;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 15px 0;
  color: #8e8e8e;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  border-top: 1px solid transparent;
  margin-top: -1px;
}

.nav-item.active {
  color: #262626;
  border-top-color: #262626;
}

.profile-posts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.post-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #fafafa;
  cursor: pointer;
}

.post-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.post-item:hover .post-overlay {
  opacity: 1;
}

.post-stats {
  display: flex;
  gap: 20px;
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.post-stats span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 4px;
  color: #8e8e8e;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10;
}

.post-item:hover .post-delete-btn {
  opacity: 1;
}

.post-delete-btn:hover {
  background: #ffebee;
  color: #e53935;
}

.no-posts {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
}

.no-posts i {
  font-size: 60px;
  color: #dbdbdb;
  margin-bottom: 20px;
}

.no-posts h3 {
  font-size: 20px;
  font-weight: 300;
  color: #8e8e8e;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #dbdbdb;
}

.modal-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #262626;
  font-size: 24px;
  border-radius: 4px;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #fafafa;
}

.modal-list {
  overflow-y: auto;
  flex: 1;
  padding: 0;
}

.modal-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-list-item:hover {
  background: #fafafa;
}

.modal-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.modal-user-info {
  flex: 1;
}

.modal-username {
  font-weight: 600;
  font-size: 14px;
}

.modal-follow-btn {
  padding: 6px 16px;
  background: #0095f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.modal-follow-btn:hover {
  background: #0081d6;
}

.modal-follow-btn.following {
  background: #efefef;
  color: #262626;
}

.modal-follow-btn.following:hover {
  background: #dbdbdb;
}

/* Модальное окно просмотра поста */
.post-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.post-modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  animation: slideUp 0.3s ease;
}

.post-modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  color: white;
  font-size: 24px;
  border-radius: 50%;
  z-index: 10;
  transition: background 0.2s;
}

.post-modal-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

.post-modal-body {
  display: flex;
  overflow: hidden;
}

.post-modal-image {
  flex: 1;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-modal-image img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
}

.post-modal-info {
  width: 400px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #dbdbdb;
}

.post-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border-bottom: 1px solid #efefef;
}

.post-modal-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.post-modal-username {
  font-weight: 600;
  font-size: 14px;
}

.post-modal-actions {
  display: flex;
  gap: 15px;
  padding: 15px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  font-size: 24px;
  color: #262626;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #8e8e8e;
}

.like-btn.liked {
  color: #ed4956;
}

.like-btn.liked:hover {
  color: #ed4956;
}

.post-modal-likes {
  padding: 0 15px;
  font-size: 14px;
}

.post-modal-likes strong {
  font-weight: 600;
}

.post-modal-caption {
  padding: 10px 15px;
  font-size: 14px;
  line-height: 1.4;
}

.post-modal-caption strong {
  font-weight: 600;
  margin-right: 5px;
}

.post-modal-comments {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  max-height: 300px;
}

.post-modal-comment {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  position: relative;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-username {
  font-weight: 600;
  font-size: 14px;
}

.comment-time {
  font-size: 12px;
  color: #8e8e8e;
}

.comment-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.delete-comment-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #8e8e8e;
  opacity: 0;
  transition: all 0.2s;
}

.post-modal-comment:hover .delete-comment-btn {
  opacity: 1;
}

.delete-comment-btn:hover {
  color: #ed4956;
}

.post-modal-add-comment {
  display: flex;
  gap: 10px;
  padding: 15px;
  border-top: 1px solid #efefef;
}

.comment-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: inherit;
}

.submit-comment-btn {
  background: none;
  border: none;
  color: #0095f6;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
}

.submit-comment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .post-modal-body {
    flex-direction: column;
  }

  .post-modal-info {
    width: 100%;
    border-left: none;
    border-top: 1px solid #dbdbdb;
  }

  .post-modal-image img {
    max-height: 50vh;
  }
}

@media (max-width: 735px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-top {
    flex-direction: column;
  }

  .profile-stats {
    justify-content: center;
  }

  .profile-nav {
    gap: 20px;
  }

  .profile-posts {
    gap: 3px;
  }
}
</style>
