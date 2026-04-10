import { defineStore } from "pinia";
import { storyAPI } from "@/api/axios";

export const useStoriesStore = defineStore("stories", {
  state: () => ({
    // Лента историй: [{ user, stories: [] }]
    storiesFeed: [],
    // Текущая просматриваемая история
    currentStoryIndex: 0,
    currentUsername: null,
    // Просмотренные истории (username)
    viewedStories: new Set(),
    // Показывать карусель
    showCarousel: false,
  }),

  getters: {
    hasStories: (state) => state.storiesFeed.length > 0,
    currentStory: (state) => {
      if (!state.currentUsername) return null;
      const userStories = state.storiesFeed.find(
        (s) => s.user.username === state.currentUsername,
      );
      return userStories?.stories[state.currentStoryIndex] || null;
    },
    isStoryViewed: (state) => (username) => {
      return state.viewedStories.has(username);
    },
  },

  actions: {
    async fetchStories() {
      try {
        const response = await storyAPI.getAll();

        this.storiesFeed = response.data || [];
        return { success: true };
      } catch (error) {
        console.error("Fetch stories error:", error);
        return {
          success: false,
          message: error.response?.data?.message || "Ошибка загрузки историй",
        };
      }
    },

    async fetchUserStories(username) {
      try {
        const response = await storyAPI.getByUsername(username);
        return { success: true, stories: response.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Ошибка загрузки историй",
        };
      }
    },

    async createStory(formData) {
      try {
        const response = await storyAPI.create(formData);
        const { story } = response.data;

        // Получаем текущие истории пользователя из API
        const currentUserId = localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user"))._id
          : null;

        // Обновляем ленту - добавляем историю текущего пользователя
        const myStoriesIndex = this.storiesFeed.findIndex(
          (s) => s.user._id === currentUserId,
        );

        if (myStoriesIndex !== -1) {
          // Добавляем историю к существующим
          this.storiesFeed[myStoriesIndex].stories.unshift(story);
        } else {
          // Создаём новую запись для текущего пользователя
          this.storiesFeed.unshift({
            user: story.user,
            stories: [story],
          });
        }

        return { success: true, story };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Ошибка создания истории",
        };
      }
    },

    async deleteStory(storyId) {
      try {
        await storyAPI.delete(storyId);

        // Удаляем из ленты
        for (const userStories of this.storiesFeed) {
          userStories.stories = userStories.stories.filter(
            (s) => s._id !== storyId,
          );
        }
        this.storiesFeed = this.storiesFeed.filter((s) => s.stories.length > 0);

        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Ошибка удаления истории",
        };
      }
    },

    async viewStory(storyId) {
      try {
        await storyAPI.view(storyId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Ошибка просмотра",
        };
      }
    },

    // Навигация
    openStory(username, index = 0) {
      this.currentUsername = username;
      this.currentStoryIndex = index;
      this.showCarousel = true;
    },

    nextStory() {
      const userStories = this.storiesFeed.find(
        (s) => s.user.username === this.currentUsername,
      );
      if (!userStories) return;

      if (this.currentStoryIndex < userStories.stories.length - 1) {
        this.currentStoryIndex++;
      } else {
        // Переход к следующему пользователю
        const currentIndex = this.storiesFeed.findIndex(
          (s) => s.user.username === this.currentUsername,
        );
        if (currentIndex < this.storiesFeed.length - 1) {
          const nextUser = this.storiesFeed[currentIndex + 1];
          this.currentUsername = nextUser.user.username;
          this.currentStoryIndex = 0;
        } else {
          this.closeViewer();
        }
      }
    },

    prevStory() {
      if (this.currentStoryIndex > 0) {
        this.currentStoryIndex--;
      } else {
        // Переход к предыдущему пользователю
        const currentIndex = this.storiesFeed.findIndex(
          (s) => s.user.username === this.currentUsername,
        );
        if (currentIndex > 0) {
          const prevUser = this.storiesFeed[currentIndex - 1];
          this.currentUsername = prevUser.user.username;
          this.currentStoryIndex = prevUser.stories.length - 1;
        }
      }
    },

    closeViewer() {
      this.currentUsername = null;
      this.currentStoryIndex = 0;
      this.showCarousel = false;
    },

    // Отметить историю как просмотренную
    markAsViewed(username) {
      this.viewedStories.add(username);
    },
  },
});
