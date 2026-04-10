<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { usePostsStore } from "@/stores/posts";
import { assetUrl } from "@/utils/url";
import { notifyError } from "@/utils/notify";
import Comment from "./Comment.vue";
import LikeButton from "./LikeButton.vue";

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["post-deleted", "follow-status-changed"]);

const authStore = useAuthStore();
const postsStore = usePostsStore();

const currentUser = computed(() => authStore.currentUser);

const postUser = computed(() => props.post.user || {});

// Проверка, подписан ли текущий пользователь на автора поста
const isFollowing = computed(() => {
  if (!currentUser.value || !postUser.value._id) return false;
  if (postUser.value._id === currentUser.value._id) return false;
  return currentUser.value.following?.some((id) => {
    const userId = typeof id === "string" ? id : id._id;
    return userId === postUser.value._id;
  });
});

const postImage = computed(() => {
  const imageUrl = props.post.image;
  return assetUrl(imageUrl);
});

const avatarUrl = computed(() => {
  const avatar = postUser.value?.avatar;
  return assetUrl(avatar);
});

const timeAgo = computed(() => {
  if (!props.post.createdAt) return "";
  const now = new Date();
  const created = new Date(props.post.createdAt);
  const diffMs = now - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "только что";
  if (diffHours < 24) return `${diffHours} ч.`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} д.`;
});

const isLiked = computed(() => {
  // Проверяем, лайкнут ли пост текущим пользователем
  return props.post.likes?.some((like) => like._id === currentUser.value?._id);
});

const likesCount = computed(() => props.post.likes?.length || 0);

// Проверка, является ли текущий пользователь владельцем поста
const isOwner = computed(() => {
  return currentUser.value && props.post.user?._id === currentUser.value._id;
});

// Удаление поста
async function handleDelete() {
  if (!confirm("Вы уверены, что хотите удалить этот пост?")) return;

  const result = await postsStore.deletePost(props.post._id);

  if (result.success) {
    emit("post-deleted", props.post._id);
  } else {
    notifyError(result.message);
  }
}

// Подписка/отписка
async function toggleFollow() {
  if (!postUser.value._id || postUser.value._id === currentUser.value?._id)
    return;

  try {
    if (isFollowing.value) {
      await authStore.unfollowUser(postUser.value._id);
    } else {
      await authStore.followUser(postUser.value._id);
    }
    emit("follow-status-changed", postUser.value._id);
  } catch (err) {
    console.error("Follow error:", err);
    notifyError("Ошибка при подписке/отписке");
  }
}

// Обработка добавления комментария
function handleCommentAdded(comment) {
  // Обновляем счетчик комментариев в посте (если нужно)
}

// Обработка удаления комментария
function handleCommentDeleted(commentId) {
  // Комментарий удален
}
</script>

<template>
  <div class="card">
    <div class="header-card">
      <div class="user-foto">
        <img :src="avatarUrl" :alt="postUser.username" />
      </div>
      <div class="user-name">
        <div class="user-info">
          <span class="username">{{ postUser.username || "unknown" }}</span>
          <span class="time">{{ timeAgo }}</span>
        </div>
        <div v-if="post.location" class="location">
          <span>{{ post.location }}</span>
        </div>
        <div class="header-actions">
          <button
            v-if="!isOwner && !isFollowing"
            class="follow-btn"
            @click="toggleFollow"
          >
            Подписаться
          </button>
          <button
            v-if="!isOwner && isFollowing"
            class="following-btn"
            @click="toggleFollow"
          >
            Вы подписаны
          </button>
          <button
            v-if="isOwner"
            class="delete-btn"
            @click="handleDelete"
            title="Удалить пост"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="foto-card">
      <img :src="postImage" :alt="post.caption || 'Post image'" />
    </div>

    <LikeButton
      :post-id="post._id"
      :is-liked="isLiked"
      :likes-count="likesCount"
    />

    <div class="description-card">
      <span class="user-name">{{ postUser.username }}</span>
      <span v-if="post.caption" class="caption">{{ post.caption }}</span>
    </div>

    <div class="coment-card">
      <Comment
        :post-id="post._id"
        :comments="post.comments || []"
        @comment-added="handleCommentAdded"
        @comment-deleted="handleCommentDeleted"
      />
    </div>
  </div>
</template>

<style scoped>
.card {
  background: white;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  margin: 0 auto 20px;
  max-width: 630px;
}

.header-card {
  display: flex;
  align-items: center;
  padding: 14px;
  gap: 12px;
}

.user-foto {
  flex-shrink: 0;
}

.user-foto img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: 10px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name .username {
  font-weight: 600;
  font-size: 14px;
}

.user-name .time {
  font-size: 12px;
  color: #8e8e8e;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.follow-btn,
.following-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.follow-btn {
  background: #0095f6;
  color: white;
}

.follow-btn:hover {
  background: #0081d6;
}

.following-btn {
  background: #efefef;
  color: #262626;
}

.following-btn:hover {
  background: #dbdbdb;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #8e8e8e;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0;
}

.card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #ffebee;
  color: #e53935;
}

.location {
  font-size: 12px;
  color: #405de6;
}

.foto-card {
  width: 100%;
  background: #fafafa;
}

.foto-card img {
  width: 100%;
  height: auto;
  display: block;
}

.description-card {
  padding: 12px 14px;
}

.description-card .user-name {
  font-weight: 600;
  margin-right: 8px;
}

.caption {
  font-size: 14px;
}

.coment-card {
  border-top: 1px solid #efefef;
  padding: 12px 14px;
}
</style>
