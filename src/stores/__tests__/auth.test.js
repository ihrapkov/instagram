import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { authAPI, userAPI } from '@/api/axios'

// Мокаем API модули
vi.mock('@/api/axios', () => ({
  authAPI: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn()
  },
  userAPI: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
    deleteAvatar: vi.fn(),
    follow: vi.fn(),
    unfollow: vi.fn()
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    
    // Очищаем localStorage перед каждым тестом
    localStorage.getItem.mockReturnValue(null)
  })

  it('инициализируется с начальным состоянием', () => {
    const store = useAuthStore()
    
    expect(store.user).toBeNull()
    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('загружает данные из localStorage при инициализации', () => {
    const mockUser = { _id: '1', username: 'testuser' }
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(mockUser)
      if (key === 'accessToken') return 'test-token'
      if (key === 'refreshToken') return 'refresh-token'
      if (key === 'isAuthenticated') return 'true'
      return null
    })

    const store = useAuthStore()
    
    expect(store.user).toEqual(mockUser)
    expect(store.accessToken).toBe('test-token')
    expect(store.isAuthenticated).toBe(true)
  })

  it('успешная регистрация', async () => {
    const store = useAuthStore()
    const mockResponse = {
      data: {
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
        user: { _id: '1', username: 'newuser' }
      }
    }
    
    authAPI.register.mockResolvedValue(mockResponse)

    const result = await store.register({
      username: 'newuser',
      email: 'test@example.com',
      password: 'password123'
    })

    expect(authAPI.register).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'test@example.com',
      password: 'password123'
    })
    expect(result.success).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.accessToken).toBe('new-token')
    expect(store.user.username).toBe('newuser')
  })

  it('ошибка регистрации', async () => {
    const store = useAuthStore()
    const mockError = {
      response: {
        data: {
          message: 'Пользователь уже существует'
        }
      }
    }
    
    authAPI.register.mockRejectedValue(mockError)

    const result = await store.register({
      username: 'existinguser',
      email: 'test@example.com',
      password: 'password123'
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Пользователь уже существует')
    expect(store.isAuthenticated).toBe(false)
  })

  it('успешный вход', async () => {
    const store = useAuthStore()
    const mockResponse = {
      data: {
        accessToken: 'login-token',
        refreshToken: 'login-refresh-token',
        user: { _id: '2', username: 'loginuser' }
      }
    }
    
    authAPI.login.mockResolvedValue(mockResponse)

    const result = await store.login({
      username: 'loginuser',
      password: 'password123'
    })

    expect(authAPI.login).toHaveBeenCalledWith({
      username: 'loginuser',
      password: 'password123'
    })
    expect(result.success).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.user.username).toBe('loginuser')
  })

  it('ошибка входа', async () => {
    const store = useAuthStore()
    const mockError = {
      response: {
        data: {
          message: 'Неверный пароль'
        }
      }
    }
    
    authAPI.login.mockRejectedValue(mockError)

    const result = await store.login({
      username: 'wronguser',
      password: 'wrongpassword'
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Неверный пароль')
  })

  it('успешный выход', async () => {
    const store = useAuthStore()
    
    // Сначала устанавливаем данные
    store._setAuthData('token', 'refresh', { _id: '1', username: 'test' })
    
    authAPI.logout.mockResolvedValue({})

    await store.logout()

    expect(authAPI.logout).toHaveBeenCalled()
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(store.accessToken).toBeNull()
  })

  it('checkAuth загружает данные из localStorage', () => {
    const store = useAuthStore()
    const mockUser = { _id: '1', username: 'testuser' }
    
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'stored-token'
      if (key === 'user') return JSON.stringify(mockUser)
      return null
    })

    store.checkAuth()

    expect(store.accessToken).toBe('stored-token')
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
  })

  it('isFollowing возвращает true если пользователь подписан', () => {
    const store = useAuthStore()
    store.user = {
      _id: '1',
      username: 'testuser',
      following: ['user1', 'user2', 'user3']
    }

    expect(store.isFollowing('user1')).toBe(true)
    expect(store.isFollowing('user2')).toBe(true)
    expect(store.isFollowing('user99')).toBe(false)
  })

  it('followUser добавляет пользователя в following', async () => {
    const store = useAuthStore()
    store.user = {
      _id: '1',
      username: 'testuser',
      following: ['user1']
    }

    userAPI.follow.mockResolvedValue({})

    const result = await store.followUser('user2')

    expect(result.success).toBe(true)
    expect(store.user.following).toContain('user2')
    expect(store.user.following).toHaveLength(2)
  })

  it('unfollowUser удаляет пользователя из following', async () => {
    const store = useAuthStore()
    store.user = {
      _id: '1',
      username: 'testuser',
      following: ['user1', 'user2', 'user3']
    }

    userAPI.unfollow.mockResolvedValue({})

    const result = await store.unfollowUser('user2')

    expect(result.success).toBe(true)
    expect(store.user.following).not.toContain('user2')
    expect(store.user.following).toHaveLength(2)
  })
})
