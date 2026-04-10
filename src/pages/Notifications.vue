<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useNotificationsStore } from "@/stores/notifications";
import { useAuthStore } from "@/stores/auth";
import { userAPI } from "@/api/axios";

const router = useRouter();
const notificationsStore = useNotificationsStore();
const authStore = useAuthStore();

const filter = ref("all");
const error = ref(null);

// Загрузка уведомлений
async function loadNotifications() {
  error.value = null;
  const result = await notificationsStore.fetchNotifications();
  if (!result.success) {
    error.value = result.message;
  }
}

// Переход к профилю
function goToProfile(username) {
  router.push(`/profile/${username}`);
}

// Переход к посту
function goToPost(postId) {
  // Пока просто закрываем уведомление
  console.log("Post:", postId);
}

// Подписка на пользователя
async function followUser(notification) {
  try {
    await userAPI.follow(notification.sender._id);
    // Удаляем уведомление из списка
    await notificationsStore.deleteNotification(notification._id);
  } catch (err) {
    console.error("Follow error:", err);
  }
}

// Проверка, подписан ли уже
function isFollowing(userId) {
  return authStore.currentUser?.following?.some((id) => {
    const uid = typeof id === "string" ? id : id._id;
    return uid === userId;
  });
}

// Удаление уведомления
async function deleteNotification(notificationId) {
  await notificationsStore.deleteNotification(notificationId);
}

// Отметить как прочитанное
async function markAsRead(notificationId) {
  await notificationsStore.markAsRead(notificationId);
}

// Текст уведомления в зависимости от типа
function getNotificationText(notification) {
  switch (notification.type) {
    case "like":
      return "понравилась(ось) ваша публикация";
    case "comment":
      return `оставил(а) комментарий: "${notification.comment?.text || ""}"`;
    case "follow":
      return "начал(а) подписываться на вас";
    case "like_comment":
      return "понравился ваш комментарий";
    default:
      return "";
  }
}

// Иконка для типа уведомления
function getNotificationIcon(type) {
  switch (type) {
    case "like":
      return "fa-heart";
    case "comment":
      return "fa-comment";
    case "follow":
      return "fa-user-plus";
    case "like_comment":
      return "fa-heart";
    default:
      return "fa-bell";
  }
}

// Фильтрованные уведомления
const filteredNotifications = computed(() => {
  const notifications = notificationsStore.allNotifications;
  if (filter.value === "all") return notifications;

  return notifications.filter((n) => {
    if (filter.value === "follows") return n.type === "follow";
    if (filter.value === "likes")
      return n.type === "like" || n.type === "like_comment";
    if (filter.value === "comments") return n.type === "comment";
    return true;
  });
});

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

onMounted(() => {
  loadNotifications();
});
</script>

<template>
  <div class="notifications-page">
    <div class="notifications-header">
      <h1>Уведомления</h1>
      <div class="notification-tabs">
        <button
          :class="['tab', { active: filter === 'all' }]"
          @click="filter = 'all'"
        >
          Все
        </button>
        <button
          :class="['tab', { active: filter === 'follows' }]"
          @click="filter = 'follows'"
        >
          Подписки
        </button>
        <button
          :class="['tab', { active: filter === 'likes' }]"
          @click="filter = 'likes'"
        >
          Лайки
        </button>
        <button
          :class="['tab', { active: filter === 'comments' }]"
          @click="filter = 'comments'"
        >
          Комментарии
        </button>
      </div>
    </div>

    <div v-if="error" class="error">
      <i class="fa-solid fa-circle-exclamation"></i>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadNotifications">Повторить</button>
    </div>

    <div v-else-if="notificationsStore.loading" class="loading">
      Загрузка...
    </div>

    <div
      v-else-if="filteredNotifications.length === 0"
      class="no-notifications"
    >
      <i class="fa-regular fa-bell"></i>
      <p>Нет уведомлений</p>
    </div>

    <div v-else class="notifications-list">
      <div
        v-for="notification in filteredNotifications"
        :key="notification._id"
        :class="[
          'notification-item',
          notification.type,
          { unread: !notification.isRead },
        ]"
        @click="markAsRead(notification._id)"
      >
        <div class="notification-icon">
          <i :class="['fa-solid', getNotificationIcon(notification.type)]"></i>
        </div>
        <div
          v-if="notification.sender"
          class="notification-avatar"
          @click.stop="goToProfile(notification.sender.username)"
        >
          <img
            :src="
              notification.sender.avatar
                ? `http://localhost:5000${notification.sender.avatar}`
                : '/img/foto.jpg'
            "
            :alt="notification.sender.username"
          />
        </div>
        <div class="notification-content">
          <p>
            <span
              v-if="notification.sender"
              class="username"
              @click.stop="goToProfile(notification.sender.username)"
            >
              {{ notification.sender.username }}
            </span>
            {{ getNotificationText(notification) }}
            <span class="notification-time">{{
              timeAgo(notification.createdAt)
            }}</span>
          </p>
        </div>
        <div
          v-if="notification.post?.image"
          class="notification-post"
          @click.stop="goToPost(notification.post._id)"
        >
          <img
            :src="`http://localhost:5000${notification.post.image}`"
            alt="Post"
          />
        </div>
        <div
          v-else-if="notification.type === 'follow' && notification.sender"
          class="follow-action"
        >
          <button
            v-if="!isFollowing(notification.sender._id)"
            class="follow-btn-small"
            @click.stop="followUser(notification)"
          >
            Подписаться
          </button>
          <span v-else class="following-label">Вы подписаны</span>
        </div>
        <button
          class="delete-notification-btn"
          @click.stop="deleteNotification(notification._id)"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.notifications-header {
  margin-bottom: 20px;
}

.notifications-header h1 {
  font-size: 28px;
  font-weight: 300;
  margin: 0 0 20px;
}

.notification-tabs {
  display: flex;
  gap: 10px;
  border-top: 1px solid #dbdbdb;
  padding-top: 10px;
}

.tab {
  padding: 8px 16px;
  border: 1px solid #dbdbdb;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tab:hover {
  background: #fafafa;
}

.tab.active {
  background: #262626;
  color: white;
  border-color: #262626;
}

.loading,
.no-notifications,
.error {
  text-align: center;
  padding: 60px 20px;
  color: #8e8e8e;
}

.error {
  color: #ed4956;
}

.error i {
  font-size: 60px;
  margin-bottom: 15px;
  display: block;
}

.error p {
  margin: 0 0 20px;
  font-size: 16px;
}

.retry-btn {
  padding: 8px 24px;
  background: #0095f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #0081d6;
}

.no-notifications i {
  font-size: 60px;
  margin-bottom: 15px;
}

.no-notifications p {
  margin: 0;
  font-size: 16px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #efefef;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #fafafa;
}

.notification-item.unread {
  background: #f0f8ff;
}

.notification-item.unread:hover {
  background: #e8f4ff;
}

.notification-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #0095f6;
}

.notification-item.like .notification-icon {
  color: #ed4956;
}

.notification-item.follow .notification-icon {
  color: #0095f6;
}

.notification-item.comment .notification-icon {
  color: #0095f6;
}

.notification-avatar img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.notification-content {
  flex: 1;
}

.notification-content p {
  margin: 0;
  font-size: 14px;
}

.notification-content .username {
  font-weight: 600;
  cursor: pointer;
}

.notification-content .username:hover {
  text-decoration: underline;
}

.notification-time {
  color: #8e8e8e;
  font-size: 12px;
  margin-left: 5px;
}

.notification-post {
  flex-shrink: 0;
  cursor: pointer;
}

.notification-post img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 4px;
}

.follow-action {
  flex-shrink: 0;
}

.follow-btn-small {
  padding: 6px 16px;
  background: #0095f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
}

.follow-btn-small:hover {
  background: #0081d6;
}

.following-label {
  padding: 6px 16px;
  background: #efefef;
  color: #262626;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}

.delete-notification-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #8e8e8e;
  opacity: 0;
  transition: all 0.2s;
}

.notification-item:hover .delete-notification-btn {
  opacity: 1;
}

.delete-notification-btn:hover {
  color: #ed4956;
}
</style>
