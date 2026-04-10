<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search'
import { useAuthStore } from '@/stores/auth'
import { userAPI } from '@/api/axios'

const router = useRouter()
const searchStore = useSearchStore()
const authStore = useAuthStore()

// Поисковый запрос
const searchQuery = ref('')
const showResults = ref(false)

// Результаты поиска
const searchResults = computed(() => searchStore.searchResults)
const loading = computed(() => searchStore.loading)

// Рекомендуемые аккаунты (показываем когда нет поиска)
const suggestedAccounts = ref([
  { id: 1, username: 'alice_wonder', avatar: '', subtitle: 'Популярно', _id: null },
  { id: 2, username: 'john_doe', avatar: '', subtitle: 'Новый аккаунт', _id: null },
  { id: 3, username: 'marry_jane', avatar: '', subtitle: 'Рекомендуем', _id: null }
])

// Загрузка реальных ID рекомендуемых аккаунтов
async function loadSuggestedUsers() {
  for (const account of suggestedAccounts.value) {
    try {
      const response = await userAPI.getProfile(account.username)
      account._id = response.data.user._id
      account.avatar = response.data.user.avatar || ''
    } catch (err) {
      console.error(`Error loading ${account.username}:`, err)
    }
  }
}

// Подписка на пользователя из рекомендуемых
async function followSuggested(account) {
  try {
    if (!account._id) {
      // Загружаем ID если ещё не загружен
      const response = await userAPI.getProfile(account.username)
      account._id = response.data.user._id
    }
    await authStore.followUser(account._id)
  } catch (err) {
    console.error('Follow error:', err)
    alert('Ошибка при подписке')
  }
}

// Проверка, подписан ли на рекомендуемого
function isFollowingSuggested(account) {
  if (!account._id) return false
  return authStore.currentUser?.following?.some(id => {
    const uid = typeof id === 'string' ? id : id._id
    return uid === account._id
  })
}

// Проверка, подписан ли на пользователя из поиска
function isFollowingUser(userId) {
  return authStore.currentUser?.following?.some(id => {
    const uid = typeof id === 'string' ? id : id._id
    return uid === userId
  })
}

// Подписка из поиска
async function followFromSearch(user) {
  try {
    await authStore.followUser(user._id)
  } catch (err) {
    console.error('Follow error:', err)
    alert('Ошибка при подписке')
  }
}

// Поиск с задержкой
let searchTimeout = null
watch(searchQuery, (newQuery) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchStore.searchUsers(newQuery)
  }, 300)
})

onMounted(() => {
  loadSuggestedUsers()
})

// Переход к профилю
function goToProfile(username) {
  router.push(`/profile/${username}`)
  searchQuery.value = ''
  showResults.value = false
  searchStore.clearResults()
}

// Проверка, является ли пользователь найденным
function isFoundUser(userId) {
  return authStore.currentUser?.following?.some(id => {
    const uid = typeof id === 'string' ? id : id._id
    return uid === userId
  })
}
</script>

<template>
  <div class="explore-page">
    <div class="explore-header">
      <div class="search-container" :class="{ 'active': showResults && searchQuery }">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input
          v-model="searchQuery"
          @focus="showResults = true"
          @blur="setTimeout(() => showResults = false, 200)"
          type="text"
          placeholder="Поиск пользователей"
          class="search-input"
        />
        <!-- Выпадающие результаты поиска -->
        <div v-if="showResults && searchQuery" class="search-results-dropdown">
          <div v-if="loading" class="search-loading">
            <i class="fa-solid fa-spinner fa-spin"></i> Поиск...
          </div>
          <div v-else-if="searchResults.length > 0" class="search-results">
            <div
              v-for="user in searchResults"
              :key="user._id"
              class="search-result-item"
            >
              <img
                :src="user.avatar ? `http://localhost:5000${user.avatar}` : '/img/foto.jpg'"
                :alt="user.username"
                class="result-avatar"
                @click="goToProfile(user.username)"
              />
              <div class="result-info" @click="goToProfile(user.username)">
                <span class="result-username">{{ user.username }}</span>
                <span class="result-fullname" v-if="user.fullName">{{ user.fullName }}</span>
              </div>
              <button
                v-if="user._id !== authStore.currentUser?._id"
                :class="['follow-btn', { following: isFollowingUser(user._id) }]"
                @click.stop="followFromSearch(user)"
              >
                {{ isFollowingUser(user._id) ? 'Вы подписаны' : 'Подписаться' }}
              </button>
            </div>
          </div>
          <div v-else-if="searchQuery && !loading" class="search-no-results">
            Ничего не найдено
          </div>
        </div>
      </div>
    </div>

    <!-- Рекомендуемые аккаунты -->
    <div v-if="!searchQuery" class="suggested-section">
      <h3>Рекомендуемые аккаунты</h3>
      <div class="suggested-list">
        <div
          v-for="account in suggestedAccounts"
          :key="account.id"
          class="suggested-item"
        >
          <img 
            :src="account.avatar || '/img/foto.jpg'" 
            :alt="account.username" 
            class="suggested-avatar"
            @click="goToProfile(account.username)"
          />
          <div class="suggested-info" @click="goToProfile(account.username)">
            <span class="suggested-username">{{ account.username }}</span>
            <span class="suggested-subtitle">{{ account.subtitle }}</span>
          </div>
          <button
            :class="['follow-btn', { following: isFollowingSuggested(account) }]"
            @click="followSuggested(account)"
          >
            {{ isFollowingSuggested(account) ? 'Вы подписаны' : 'Подписаться' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Пустая сетка для визуального заполнения -->
    <div v-if="!searchQuery" class="explore-grid">
      <div
        v-for="i in 9"
        :key="i"
        class="explore-item"
      >
        <img :src="`/img/foto${(i % 3) + 1}.jpg`" :alt="'Explore ' + i" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.explore-page {
  max-width: 935px;
  margin: 0 auto;
  padding: 20px;
}

.explore-header {
  margin-bottom: 20px;
  position: relative;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: #fafafa;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  position: relative;
}

.search-container.active {
  border-radius: 8px 8px 0 0;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  width: 100%;
}

.search-results-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dbdbdb;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.search-loading,
.search-no-results {
  padding: 20px;
  text-align: center;
  color: #8e8e8e;
}

.search-loading i {
  margin-right: 8px;
}

.search-results {
  display: flex;
  flex-direction: column;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: #fafafa;
}

.result-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-username {
  font-weight: 600;
  font-size: 14px;
}

.result-fullname {
  font-size: 12px;
  color: #8e8e8e;
}

.search-result-item .follow-btn {
  padding: 6px 12px;
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

.search-result-item .follow-btn:hover {
  background: #0081d6;
}

.search-result-item .follow-btn.following {
  background: #efefef;
  color: #262626;
}

.search-result-item .follow-btn.following:hover {
  background: #dbdbdb;
}

.suggested-section {
  border-top: 1px solid #dbdbdb;
  padding-top: 20px;
  margin-bottom: 40px;
}

.suggested-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
}

.suggested-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.suggested-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.suggested-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.suggested-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  cursor: pointer;
}

.suggested-username {
  font-weight: 600;
  font-size: 14px;
}

.suggested-subtitle {
  font-size: 12px;
  color: #8e8e8e;
}

.follow-btn {
  padding: 5px 12px;
  background: #0095f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
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

.explore-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.explore-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
}

.explore-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 735px) {
  .explore-grid {
    gap: 3px;
  }
}
</style>
