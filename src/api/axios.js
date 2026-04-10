import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Создаём экземпляр axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Добавляем токен к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Обрабатываем ошибки (например, истёкший токен)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Если ошибка 401 и ещё не пробовали обновить токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')

      if (refreshToken) {
        try {
          // Пробуем обновить токен
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data

          // Сохраняем новые токены
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          // Повторяем исходный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          // Не удалось обновить токен — выходим
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('isAuthenticated')
          localStorage.removeItem('user')

          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

// API методы
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken })
}

export const userAPI = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) =>
    api.put('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteAvatar: () => api.delete('/users/avatar'),
  follow: (id) => api.post(`/users/${id}/follow`),
  unfollow: (id) => api.post(`/users/${id}/unfollow`),
  search: (query) => api.get('/users/search', { params: { q: query } })
}

export const postAPI = {
  getFeed: (page = 1, limit = 10) =>
    api.get('/posts/feed', { params: { page, limit } }),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (formData) =>
    api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deletePost: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  unlike: (id) => api.post(`/posts/${id}/unlike`),
  getUserPosts: (userId, page = 1, limit = 9) =>
    api.get(`/posts/user/${userId}`, { params: { page, limit } })
}

export const storyAPI = {
  getAll: () => api.get('/stories/'),
  getByUsername: (username) => api.get(`/stories/${username}`),
  create: (formData) =>
    api.post('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  delete: (id) => api.delete(`/stories/${id}`),
  view: (id) => api.post(`/stories/${id}/view`)
}

export const commentAPI = {
  getComments: (postId) => api.get(`/comments/${postId}`),
  addComment: (postId, text) => api.post('/comments', { postId, text }),
  deleteComment: (id) => api.delete(`/comments/${id}`),
  likeComment: (id) => api.post(`/comments/${id}/like`),
  unlikeComment: (id) => api.post(`/comments/${id}/unlike`)
}

export const notificationAPI = {
  getAll: (page = 1, limit = 20) =>
    api.get('/notifications', { params: { page, limit } }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
}

export default api
