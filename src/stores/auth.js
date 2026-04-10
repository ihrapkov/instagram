import { defineStore } from "pinia";
import { authAPI, userAPI } from "@/api/axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(localStorage.getItem("user") || "null"),
    accessToken: localStorage.getItem("accessToken") || null,
    refreshToken: localStorage.getItem("refreshToken") || null,
    isAuthenticated: localStorage.getItem("isAuthenticated") === "true",
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
    isFollowing: (state) => (userId) => {
      if (!state.user || !userId) return false;
      return state.user.following?.some((id) => {
        const idStr = typeof id === "string" ? id : id._id;
        return idStr === userId;
      });
    },
  },

  actions: {
    async register(userData) {
      try {
        const response = await authAPI.register(userData);
        const { accessToken, refreshToken, user } = response.data;

        this._setAuthData(accessToken, refreshToken, user);
        return { success: true };
      } catch (error) {
        console.error("Register error:", error.response?.data);
        const errorData = error.response?.data;
        return {
          success: false,
          message:
            errorData?.message ||
            errorData?.errors?.[0]?.message ||
            "Ошибка регистрации",
        };
      }
    },

    async login(credentials) {
      try {
        const response = await authAPI.login(credentials);
        const { accessToken, refreshToken, user } = response.data;

        this._setAuthData(accessToken, refreshToken, user);
        return { success: true };
      } catch (error) {
        console.error("Login error:", error.response?.data);
        return {
          success: false,
          message: error.response?.data?.message || "Ошибка входа",
        };
      }
    },

    async logout() {
      try {
        await authAPI.logout();
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        this._clearAuthData();
      }
    },

    async fetchProfile(username) {
      try {
        const response = await userAPI.getProfile(username);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    async updateProfile(profileData) {
      try {
        const response = await userAPI.updateProfile(profileData);
        const { user } = response.data;

        this.user = user;
        localStorage.setItem("user", JSON.stringify(user));
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Ошибка обновления",
        };
      }
    },

    async uploadAvatar(formData) {
      try {
        const response = await userAPI.uploadAvatar(formData);
        const { avatar } = response.data;

        // Обновляем данные пользователя
        this.user.avatar = avatar;
        localStorage.setItem("user", JSON.stringify(this.user));

        return { success: true, avatar };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Ошибка загрузки аватара",
        };
      }
    },

    async deleteAvatar() {
      try {
        await userAPI.deleteAvatar();

        // Обновляем данные пользователя
        this.user.avatar = "";
        localStorage.setItem("user", JSON.stringify(this.user));

        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Ошибка удаления аватара",
        };
      }
    },

    async followUser(userId) {
      try {
        await userAPI.follow(userId);
        // Обновляем данные текущего пользователя
        if (this.user) {
          this.user.following = [...(this.user.following || []), userId];
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Ошибка подписки",
        };
      }
    },

    async unfollowUser(userId) {
      try {
        await userAPI.unfollow(userId);
        // Обновляем данные текущего пользователя
        if (this.user) {
          this.user.following = this.user.following?.filter((id) => {
            const idStr = typeof id === "string" ? id : id._id;
            return idStr !== userId;
          });
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Ошибка отписки",
        };
      }
    },

    _setAuthData(accessToken, refreshToken, user) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.user = user;
      this.isAuthenticated = true;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("isAuthenticated", "true");
    },

    _clearAuthData() {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      this.isAuthenticated = false;

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthenticated");
    },

    // Проверка токена при загрузке приложения
    async checkAuth() {
      const token = localStorage.getItem("accessToken");
      const user = localStorage.getItem("user");

      if (token && user) {
        this.accessToken = token;
        this.user = JSON.parse(user);
        this.isAuthenticated = true;
      }
    },
  },
});
