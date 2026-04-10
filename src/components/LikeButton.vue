<template>
  <div class="button-card">
    <div class="thee-button">
      <span>
        <button @click="handleLike" :class="{ liked: isLiked }" :disabled="loading">
          <i :class="isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
        </button>
      </span>
      <span><i class="fa-regular fa-comment"></i></span>
      <span><i class="fa-regular fa-paper-plane"></i></span>
    </div>
    <div class="one-button">
      <span><i class="fa-regular fa-bookmark"></i></span>
    </div>
  </div>
  <div class="like-card">
    <div class="like-card-text">
      <span class="like-count">{{ likesCount }}</span>
      <span v-if="likesCount === 1">отметка "Нравится"</span>
      <span v-else-if="likesCount >= 2 && likesCount <= 4">отметки "Нравится"</span>
      <span v-else>отметок "Нравится"</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePostsStore } from '@/stores/posts'

const props = defineProps({
  postId: {
    type: String,
    required: true
  },
  isLiked: {
    type: Boolean,
    default: false
  },
  likesCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['like-change'])

const postsStore = usePostsStore()
const loading = ref(false)

const handleLike = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    if (props.isLiked) {
      const result = await postsStore.unlikePost(props.postId)
      if (result.success) {
        emit('like-change', { isLiked: false, count: result.likes })
      }
    } else {
      const result = await postsStore.likePost(props.postId)
      if (result.success) {
        emit('like-change', { isLiked: true, count: result.likes })
      }
    }
  } catch (error) {
    console.error('Like error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.button-card {
  padding: 12px 14px;
}

.thee-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.thee-button span {
  display: flex;
  gap: 16px;
}

.thee-button button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thee-button button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.one-button {
  display: flex;
  justify-content: flex-end;
}

.like-card {
  padding: 0 14px 12px;
}

.like-card-text {
  font-size: 14px;
  font-weight: 600;
}

.like-count {
  margin-right: 4px;
}

.thee-button i {
  font-size: 24px;
  cursor: pointer;
  transition: color 0.2s;
  background: none;
  border: none;
}

.thee-button button:hover i:not(.fa-solid) {
  color: #8e8e8e;
}

.thee-button button.liked i {
  color: #ed4956;
  animation: likeAnimation 0.3s ease;
}

@keyframes likeAnimation {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
