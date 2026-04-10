import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePostsStore } from '@/stores/posts'
import { postAPI } from '@/api/axios'

// Мокаем API модули
vi.mock('@/api/axios', () => ({
  postAPI: {
    getFeed: vi.fn(),
    createPost: vi.fn(),
    deletePost: vi.fn(),
    like: vi.fn(),
    unlikePost: vi.fn()
  }
}))

describe('Posts Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.getItem.mockReturnValue(null)
  })

  it('инициализируется с начальным состоянием', () => {
    const store = usePostsStore()
    
    expect(store.feed).toEqual([])
    expect(store.currentPage).toBe(1)
    expect(store.totalPages).toBe(1)
    expect(store.loading).toBe(false)
    expect(store.lastFetched).toBeNull()
  })

  it('fetchFeed загружает ленту постов', async () => {
    const store = usePostsStore()
    const mockResponse = {
      data: {
        posts: [
          { _id: '1', caption: 'Post 1', likes: [] },
          { _id: '2', caption: 'Post 2', likes: [] }
        ],
        currentPage: 1,
        totalPages: 5
      }
    }
    
    postAPI.getFeed.mockResolvedValue(mockResponse)

    const result = await store.fetchFeed(1)

    expect(postAPI.getFeed).toHaveBeenCalledWith(1, 10)
    expect(result.success).toBe(true)
    expect(store.feed).toHaveLength(2)
    expect(store.currentPage).toBe(1)
    expect(store.totalPages).toBe(5)
    expect(store.loading).toBe(false)
  })

  it('fetchFeed добавляет посты при пагинации', async () => {
    const store = usePostsStore()
    
    // Сначала загружаем первую страницу
    store.feed = [
      { _id: '1', caption: 'Post 1', likes: [] }
    ]
    
    const mockResponse = {
      data: {
        posts: [
          { _id: '2', caption: 'Post 2', likes: [] },
          { _id: '3', caption: 'Post 3', likes: [] }
        ],
        currentPage: 2,
        totalPages: 5
      }
    }
    
    postAPI.getFeed.mockResolvedValue(mockResponse)

    await store.fetchFeed(2)

    expect(store.feed).toHaveLength(3)
    expect(store.currentPage).toBe(2)
  })

  it('createPost добавляет новый пост в начало ленты', async () => {
    const store = usePostsStore()
    store.feed = [
      { _id: '1', caption: 'Old Post', likes: [] }
    ]

    const mockResponse = {
      data: {
        post: { _id: '2', caption: 'New Post', likes: [] }
      }
    }
    
    postAPI.createPost.mockResolvedValue(mockResponse)

    const formData = new FormData()
    formData.append('caption', 'New Post')
    
    const result = await store.createPost(formData)

    expect(result.success).toBe(true)
    expect(store.feed).toHaveLength(2)
    expect(store.feed[0].caption).toBe('New Post')
  })

  it('deletePost удаляет пост из ленты', async () => {
    const store = usePostsStore()
    store.feed = [
      { _id: '1', caption: 'Post 1', likes: [] },
      { _id: '2', caption: 'Post 2', likes: [] },
      { _id: '3', caption: 'Post 3', likes: [] }
    ]

    postAPI.deletePost.mockResolvedValue({})

    const result = await store.deletePost('2')

    expect(result.success).toBe(true)
    expect(store.feed).toHaveLength(2)
    expect(store.feed.find(p => p._id === '2')).toBeUndefined()
  })

  it('likePost добавляет лайк к посту', async () => {
    const store = usePostsStore()
    store.feed = [
      { _id: '1', caption: 'Post 1', likes: [] }
    ]

    const mockResponse = {
      data: {
        likes: 5
      }
    }
    
    postAPI.like.mockResolvedValue(mockResponse)
    
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify({ _id: 'user1' })
      return null
    })

    const result = await store.likePost('1')

    expect(result.success).toBe(true)
    expect(result.likes).toBe(5)
    expect(store.feed[0].likes).toHaveLength(1)
    expect(store.feed[0].likes[0]._id).toBe('user1')
  })

  it('unlikePost удаляет лайк с поста', async () => {
    const store = usePostsStore()
    store.feed = [
      { 
        _id: '1', 
        caption: 'Post 1', 
        likes: [
          { _id: 'user1' },
          { _id: 'user2' }
        ] 
      }
    ]

    const mockResponse = {
      data: {
        likes: 1
      }
    }
    
    postAPI.unlikePost.mockResolvedValue(mockResponse)
    
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify({ _id: 'user1' })
      return null
    })

    const result = await store.unlikePost('1')

    expect(result.success).toBe(true)
    expect(store.feed[0].likes).toHaveLength(1)
    expect(store.feed[0].likes.find(like => like._id === 'user1')).toBeUndefined()
  })

  it('fetchFeed обрабатывает ошибку', async () => {
    const store = usePostsStore()
    const mockError = {
      response: {
        data: {
          message: 'Ошибка загрузки ленты'
        }
      }
    }
    
    postAPI.getFeed.mockRejectedValue(mockError)

    const result = await store.fetchFeed(1)

    expect(result.success).toBe(false)
    expect(result.message).toBe('Ошибка загрузки ленты')
    expect(store.loading).toBe(false)
  })

  it('allPosts getter возвращает все посты', () => {
    const store = usePostsStore()
    const mockPosts = [
      { _id: '1', caption: 'Post 1' },
      { _id: '2', caption: 'Post 2' }
    ]
    
    store.feed = mockPosts

    expect(store.allPosts).toEqual(mockPosts)
  })
})
