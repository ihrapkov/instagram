import { defineStore } from "pinia";
import { notificationAPI } from "@/api/axios";

export const useNotificationsStore = defineStore("notifications", {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    currentPage: 1,
    totalPages: 1,
  }),

  getters: {
    allNotifications: (state) => state.notifications,
  },

  actions: {
    async fetchNotifications(page = 1) {
      this.loading = true;
      try {
        const response = await notificationAPI.getAll(page, 20);
        const { notifications, currentPage, totalPages, unreadCount } =
          response.data;

        if (page === 1) {
          this.notifications = notifications;
        } else {
          this.notifications = [...this.notifications, ...notifications];
        }

        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.unreadCount = unreadCount;

        return { success: true };
      } catch (error) {
        return {
          success: false,
          message:
            error.response?.data?.message || "Ошибка загрузки уведомлений",
        };
      } finally {
        this.loading = false;
      }
    },

    async markAsRead(notificationId) {
      try {
        await notificationAPI.markAsRead(notificationId);
        const notification = this.notifications.find(
          (n) => n._id === notificationId,
        );
        if (notification) {
          notification.isRead = true;
        }
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message:
            error.response?.data?.message || "Ошибка отметки уведомления",
        };
      }
    },

    async markAllAsRead() {
      try {
        await notificationAPI.markAllAsRead();
        this.notifications.forEach((n) => (n.isRead = true));
        this.unreadCount = 0;
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message:
            error.response?.data?.message || "Ошибка отметки всех уведомлений",
        };
      }
    },

    async deleteNotification(notificationId) {
      try {
        await notificationAPI.delete(notificationId);
        this.notifications = this.notifications.filter(
          (n) => n._id !== notificationId,
        );
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message:
            error.response?.data?.message || "Ошибка удаления уведомления",
        };
      }
    },

    // Увеличить счетчик непрочитанных
    incrementUnread() {
      this.unreadCount++;
    },

    // Сбросить счетчик
    resetUnread() {
      this.unreadCount = 0;
    },
  },
});
