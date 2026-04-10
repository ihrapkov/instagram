import { defineStore } from 'pinia'
import { postAPI } from '@/api/axios'

export const usePostsStore = defineStore('posts', {
  state: () => ({
    feed: [],
    currentPage: 1,
    totalPages: 1,
    loading: false,
    lastFetched: null
  }),

  getters: {
    allPosts: (state) => state.feed
  },

  actions: {
    async fetchFeed(page = 1) {
      this.loading = true
      try {
        const response = await postAPI.getFeed(page, 10)
        const { posts, currentPage, totalPages } = response.data

        if (page === 1) {
          this.feed = posts
        } else {
          this.feed = [...this.feed, ...posts]
        }

        this.currentPage = currentPage
        this.totalPages = totalPages
        this.lastFetched = Date.now()
        this.loading = false
        
        return { success: true }
      } catch (error) {
        this.loading = false
        return {
          success: false,
          message: error.response?.data?.message || 'Ошибка загрузки ленты'
        }
      }
    },

    async createPost(formData) {
      try {
        const response = await postAPI.createPost(formData)
        const { post } = response.data

        this.feed.unshift(post)
        return { success: true, post }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Ошибка создания поста'
        }
      }
    },

    async deletePost(postId) {
      try {
        await postAPI.deletePost(postId)
        this.feed = this.feed.filter((post) => post._id !== postId)
        return { success: true }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Ошибка удаления поста'
        }
      }
    },

    async likePost(postId) {
      try {
        const response = await postAPI.like(postId)
        const { likes } = response.data

        const post = this.feed.find((p) => p._id === postId)
        if (post) {
          const currentUserId = localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user'))._id
            : null
          if (currentUserId) {
            post.likes.push({ _id: currentUserId })
          }
        }

        return { success: true, likes }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Ошибка лайка'
        }
      }
    },

    async unlikePost(postId) {
      try {
        const response = await postAPI.unlikePost(postId)
        const { likes } = response.data

        const currentUserId = localStorage.getItem('user')
          ? JSON.parse(localStorage.getItem('user'))._id
          : null

        const post = this.feed.find((p) => p._id === postId)
        if (post && currentUserId) {
          post.likes = post.likes.filter(like => like._id !== currentUserId)
        }

        return { success: true, likes }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Ошибка удаления лайка'
        }
      }
    }
  }
})
