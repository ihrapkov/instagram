import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotificationsStore } from '@/stores/notifications'
import { notificationAPI } from '@/api/axios'

// Мокаем API модули
vi.mock('@/api/axios', () => ({
  notificationAPI: {
    getAll: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn()
  }
}))

describe('Notifications Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('инициализируется с начальным состоянием', () => {
    const store = useNotificationsStore()
    
    expect(store.notifications).toEqual([])
    expect(store.unreadCount).toBe(0)
    expect(store.loading).toBe(false)
    expect(store.currentPage).toBe(1)
    expect(store.totalPages).toBe(1)
  })

  it('fetchNotifications загружает уведомления', async () => {
    const store = useNotificationsStore()
    const mockResponse = {
      data: {
        notifications: [
          { _id: '1', type: 'like', isRead: false },
          { _id: '2', type: 'follow', isRead: false }
        ],
        currentPage: 1,
        totalPages: 3,
        unreadCount: 2
      }
    }
    
    notificationAPI.getAll.mockResolvedValue(mockResponse)

    const result = await store.fetchNotifications(1)

    expect(notificationAPI.getAll).toHaveBeenCalledWith(1, 20)
    expect(result.success).toBe(true)
    expect(store.notifications).toHaveLength(2)
    expect(store.currentPage).toBe(1)
    expect(store.totalPages).toBe(3)
    expect(store.unreadCount).toBe(2)
  })

  it('fetchNotifications добавляет уведомления при пагинации', async () => {
    const store = useNotificationsStore()
    store.notifications = [
      { _id: '1', type: 'like', isRead: false }
    ]
    
    const mockResponse = {
      data: {
        notifications: [
          { _id: '2', type: 'follow', isRead: false },
          { _id: '3', type: 'comment', isRead: false }
        ],
        currentPage: 2,
        totalPages: 3,
        unreadCount: 3
      }
    }
    
    notificationAPI.getAll.mockResolvedValue(mockResponse)

    await store.fetchNotifications(2)

    expect(store.notifications).toHaveLength(3)
    expect(store.currentPage).toBe(2)
  })

  it('fetchNotifications обрабатывает ошибку', async () => {
    const store = useNotificationsStore()
    const mockError = {
      response: {
        data: {
          message: 'Ошибка загрузки уведомлений'
        }
      }
    }
    
    notificationAPI.getAll.mockRejectedValue(mockError)

    const result = await store.fetchNotifications(1)

    expect(result.success).toBe(false)
    expect(result.message).toBe('Ошибка загрузки уведомлений')
    expect(store.loading).toBe(false)
  })

  it('markAsRead отмечает уведомление как прочитанное', async () => {
    const store = useNotificationsStore()
    store.notifications = [
      { _id: '1', type: 'like', isRead: false },
      { _id: '2', type: 'follow', isRead: false }
    ]
    store.unreadCount = 2

    notificationAPI.markAsRead.mockResolvedValue({})

    const result = await store.markAsRead('1')

    expect(notificationAPI.markAsRead).toHaveBeenCalledWith('1')
    expect(result.success).toBe(true)
    expect(store.notifications[0].isRead).toBe(true)
    expect(store.unreadCount).toBe(1)
  })

  it('markAllAsRead отмечает все уведомления как прочитанные', async () => {
    const store = useNotificationsStore()
    store.notifications = [
      { _id: '1', type: 'like', isRead: false },
      { _id: '2', type: 'follow', isRead: false },
      { _id: '3', type: 'comment', isRead: false }
    ]
    store.unreadCount = 3

    notificationAPI.markAllAsRead.mockResolvedValue({})

    const result = await store.markAllAsRead()

    expect(notificationAPI.markAllAsRead).toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect(store.notifications.every(n => n.isRead)).toBe(true)
    expect(store.unreadCount).toBe(0)
  })

  it('deleteNotification удаляет уведомление', async () => {
    const store = useNotificationsStore()
    store.notifications = [
      { _id: '1', type: 'like', isRead: false },
      { _id: '2', type: 'follow', isRead: false },
      { _id: '3', type: 'comment', isRead: false }
    ]

    notificationAPI.delete.mockResolvedValue({})

    const result = await store.deleteNotification('2')

    expect(notificationAPI.delete).toHaveBeenCalledWith('2')
    expect(result.success).toBe(true)
    expect(store.notifications).toHaveLength(2)
    expect(store.notifications.find(n => n._id === '2')).toBeUndefined()
  })

  it('incrementUnread увеличивает счетчик непрочитанных', () => {
    const store = useNotificationsStore()
    store.unreadCount = 5

    store.incrementUnread()

    expect(store.unreadCount).toBe(6)
  })

  it('resetUnread сбрасывает счетчик', () => {
    const store = useNotificationsStore()
    store.unreadCount = 10

    store.resetUnread()

    expect(store.unreadCount).toBe(0)
  })

  it('allNotifications getter возвращает все уведомления', () => {
    const store = useNotificationsStore()
    const mockNotifications = [
      { _id: '1', type: 'like' },
      { _id: '2', type: 'follow' }
    ]
    
    store.notifications = mockNotifications

    expect(store.allNotifications).toEqual(mockNotifications)
  })
})
