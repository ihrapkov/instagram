import { defineStore } from 'pinia'
import { commentAPI } from '@/api/axios'

export const useCommentsStore = defineStore('comments', {
  state: () => ({
    // Кэш комментариев по postId
    commentsByPost: {}
  }),

  getters: {
    getCommentsByPost: (state) => (postId) => {
      return state.commentsByPost[postId] || []
    }
  },

  actions: {
    async fetchComments(postId) {
      try {
        const response = await commentAPI.getComments(postId)
        this.commentsByPost[postId] = response.data
        return { success: true }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Ошибка загрузки комментариев'
        }
      }
    },

    async addComment(postId, text) {
      try {
        const response = await commentAPI.addComment(postId, text)
        const { comment } = response.data

        // Добавляем в кэш
        if (!this.commentsByPost[postId]) {
          this.commentsByPost[postId] = []
        }
        this.commentsByPost[postId].push(comment)

        return { success: true, comment }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Ошибка добавления комментария'
        }
      }
    },

    async deleteComment(postId, commentId) {
      try {
        await commentAPI.deleteComment(commentId)

        // Удаляем из кэша
        if (this.commentsByPost[postId]) {
          this.commentsByPost[postId] = this.commentsByPost[postId].filter(
            c => c._id !== commentId
          )
        }

        return { success: true }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Ошибка удаления комментария'
        }
      }
    },

    async likeComment(postId, commentId) {
      try {
        const response = await commentAPI.likeComment(commentId)
        const { likes } = response.data

        const comment = this.commentsByPost[postId]?.find(c => c._id === commentId)
        if (comment) {
          const currentUserId = localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user'))._id
            : null
          if (currentUserId) {
            comment.likes.push({ _id: currentUserId })
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

    async unlikeComment(postId, commentId) {
      try {
        const response = await commentAPI.unlikeComment(commentId)
        const { likes } = response.data

        const currentUserId = localStorage.getItem('user')
          ? JSON.parse(localStorage.getItem('user'))._id
          : null

        const comment = this.commentsByPost[postId]?.find(c => c._id === commentId)
        if (comment && currentUserId) {
          comment.likes = comment.likes.filter(like => like._id !== currentUserId)
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
