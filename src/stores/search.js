import { defineStore } from 'pinia'
import { userAPI } from '@/api/axios'

export const useSearchStore = defineStore('search', {
  state: () => ({
    searchResults: [],
    loading: false,
    hasSearched: false
  }),

  getters: {
    results: (state) => state.searchResults
  },

  actions: {
    async searchUsers(query) {
      if (!query || query.trim().length === 0) {
        this.searchResults = []
        this.hasSearched = false
        return { success: true }
      }

      this.loading = true
      try {
        const response = await userAPI.search(query)
        this.searchResults = response.data
        this.hasSearched = true
        this.loading = false
        return { success: true }
      } catch (error) {
        this.loading = false
        return {
          success: false,
          message: error.response?.data?.message || 'Ошибка поиска'
        }
      }
    },

    clearResults() {
      this.searchResults = []
      this.hasSearched = false
    }
  }
})
