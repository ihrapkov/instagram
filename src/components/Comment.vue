<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCommentsStore } from '@/stores/comments'

const props = defineProps({
  postId: {
    type: String,
    required: true
  },
  comments: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['comment-added', 'comment-deleted'])

const authStore = useAuthStore()
const commentsStore = useCommentsStore()

const newComment = ref('')
const isSubmitting = ref(false)

const currentUser = computed(() => authStore.currentUser)

const postComments = computed(() => {
  // Если комментарии переданы напрямую, используем их
  if (props.comments && props.comments.length > 0) {
    return props.comments
  }
  // Иначе берём из store
  return commentsStore.getCommentsByPost(props.postId)
})

// Загрузка комментариев при монтировании
onMounted(async () => {
  if (props.comments.length === 0) {
    await commentsStore.fetchComments(props.postId)
  }
})

// Добавление комментария
async function submitComment() {
  if (!newComment.value.trim() || !currentUser.value) return

  isSubmitting.value = true

  const result = await commentsStore.addComment(props.postId, newComment.value.trim())

  isSubmitting.value = false

  if (result.success) {
    newComment.value = ''
    emit('comment-added', result.comment)
  } else {
    alert(result.message)
  }
}

// Удаление комментария
async function deleteComment(commentId) {
  if (!confirm('Удалить комментарий?')) return

  const result = await commentsStore.deleteComment(props.postId, commentId)

  if (result.success) {
    emit('comment-deleted', commentId)
  } else {
    alert(result.message)
  }
}

// Проверка, является ли пользователь владельцем комментария
function isCommentOwner(commentUserId) {
  return currentUser.value && commentUserId === currentUser.value._id
}

// Форматирование времени
function timeAgo(dateString) {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'только что'
  if (diffMinutes < 60) return `${diffMinutes} мин.`
  if (diffHours < 24) return `${diffHours} ч.`
  return `${diffDays} д.`
}

const avatarUrl = (comment) => {
  if (!comment.user?.avatar) return '/img/foto.jpg'
  if (comment.user.avatar.startsWith('http')) return comment.user.avatar
  return `http://localhost:5000${comment.user.avatar}`
}
</script>

<template>
  <div class="comments-container">
    <!-- Список комментариев -->
    <div class="comments-list">
      <div
        v-for="comment in postComments"
        :key="comment._id"
        class="comment-item"
      >
        <router-link :to="`/profile/${comment.user?.username}`" class="comment-user">
          <img :src="avatarUrl(comment)" :alt="comment.user?.username" class="comment-avatar" />
          <span class="comment-username">{{ comment.user?.username }}</span>
        </router-link>
        <div class="comment-content">
          <span class="comment-text">{{ comment.text }}</span>
          <div class="comment-meta">
            <span class="comment-time">{{ timeAgo(comment.createdAt) }}</span>
            <button
              v-if="isCommentOwner(comment.user?._id)"
              @click="deleteComment(comment._id)"
              class="comment-delete"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-if="postComments.length === 0" class="no-comments">
        Нет комментариев. Будьте первым!
      </div>
    </div>

    <!-- Форма добавления -->
    <form @submit.prevent="submitComment" class="comment-form">
      <input
        v-model="newComment"
        type="text"
        placeholder="Добавить комментарий..."
        :disabled="!currentUser || isSubmitting"
        class="comment-input"
      />
      <button
        type="submit"
        :disabled="!newComment.trim() || isSubmitting || !currentUser"
        class="comment-submit"
      >
        {{ isSubmitting ? '...' : 'Опубликовать' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.comments-container {
  border-top: 1px solid #efefef;
  padding: 12px 14px;
}

.comments-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.comment-item {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  padding: 4px 0;
}

.comment-user {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 4px;
}

.comment-username {
  font-size: 11px;
  color: #8e8e8e;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-text {
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.comment-time {
  font-size: 12px;
  color: #8e8e8e;
}

.comment-delete {
  background: none;
  border: none;
  color: #8e8e8e;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s;
}

.comment-item:hover .comment-delete {
  opacity: 1;
}

.comment-delete:hover {
  color: #ed4956;
}

.no-comments {
  text-align: center;
  color: #8e8e8e;
  font-size: 14px;
  padding: 20px 0;
}

.comment-form {
  display: flex;
  gap: 8px;
  align-items: center;
}

.comment-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  padding: 8px 0;
  background: transparent;
}

.comment-input:disabled {
  opacity: 0.5;
}

.comment-submit {
  background: none;
  border: none;
  color: #0095f6;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.2s;
}

.comment-submit:hover:not(:disabled) {
  background: #f0f0f0;
}

.comment-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
