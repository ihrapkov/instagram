import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useStoriesStore } from '@/stores/stories'
import { storyAPI } from '@/api/axios'

// Мокаем API модули
vi.mock('@/api/axios', () => ({
  storyAPI: {
    getAll: vi.fn(),
    getByUsername: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    view: vi.fn()
  }
}))

describe('Stories Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.getItem.mockReturnValue(null)
  })

  it('инициализируется с начальным состоянием', () => {
    const store = useStoriesStore()
    
    expect(store.storiesFeed).toEqual([])
    expect(store.currentStoryIndex).toBe(0)
    expect(store.currentUsername).toBeNull()
    expect(store.viewedStories).toBeInstanceOf(Set)
    expect(store.showCarousel).toBe(false)
  })

  it('fetchStories загружает ленту историй', async () => {
    const store = useStoriesStore()
    const mockStories = [
      {
        user: { _id: '1', username: 'user1' },
        stories: [
          { _id: 's1', media: 'story1.jpg' }
        ]
      },
      {
        user: { _id: '2', username: 'user2' },
        stories: [
          { _id: 's2', media: 'story2.jpg' }
        ]
      }
    ]
    
    storyAPI.getAll.mockResolvedValue({ data: mockStories })

    const result = await store.fetchStories()

    expect(storyAPI.getAll).toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect(store.storiesFeed).toEqual(mockStories)
  })

  it('fetchStories обрабатывает ошибку', async () => {
    const store = useStoriesStore()
    const mockError = {
      response: {
        data: {
          message: 'Ошибка загрузки историй'
        }
      }
    }
    
    storyAPI.getAll.mockRejectedValue(mockError)

    const result = await store.fetchStories()

    expect(result.success).toBe(false)
    expect(result.message).toBe('Ошибка загрузки историй')
  })

  it('fetchUserStories загружает истории пользователя', async () => {
    const store = useStoriesStore()
    const mockStories = [
      { _id: 's1', media: 'story1.jpg' },
      { _id: 's2', media: 'story2.jpg' }
    ]
    
    storyAPI.getByUsername.mockResolvedValue({ data: mockStories })

    const result = await store.fetchUserStories('user1')

    expect(storyAPI.getByUsername).toHaveBeenCalledWith('user1')
    expect(result.success).toBe(true)
    expect(result.stories).toEqual(mockStories)
  })

  it('createStory добавляет историю в ленту', async () => {
    const store = useStoriesStore()
    const mockStory = {
      _id: 's1',
      media: 'new-story.jpg',
      user: { _id: 'user1', username: 'user1' }
    }
    
    storyAPI.create.mockResolvedValue({ data: { story: mockStory } })
    
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify({ _id: 'user1' })
      return null
    })

    const formData = new FormData()
    const result = await store.createStory(formData)

    expect(result.success).toBe(true)
    expect(result.story).toEqual(mockStory)
    expect(store.storiesFeed).toHaveLength(1)
    expect(store.storiesFeed[0].user._id).toBe('user1')
  })

  it('createStory добавляет историю к существующему пользователю', async () => {
    const store = useStoriesStore()
    store.storiesFeed = [
      {
        user: { _id: 'user1', username: 'user1' },
        stories: [{ _id: 's1', media: 'old-story.jpg' }]
      }
    ]

    const mockStory = {
      _id: 's2',
      media: 'new-story.jpg',
      user: { _id: 'user1', username: 'user1' }
    }
    
    storyAPI.create.mockResolvedValue({ data: { story: mockStory } })
    
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify({ _id: 'user1' })
      return null
    })

    await store.createStory(new FormData())

    expect(store.storiesFeed[0].stories).toHaveLength(2)
    expect(store.storiesFeed[0].stories[0]._id).toBe('s2')
  })

  it('deleteStory удаляет историю из ленты', async () => {
    const store = useStoriesStore()
    store.storiesFeed = [
      {
        user: { _id: 'user1', username: 'user1' },
        stories: [
          { _id: 's1', media: 'story1.jpg' },
          { _id: 's2', media: 'story2.jpg' }
        ]
      }
    ]

    storyAPI.delete.mockResolvedValue({})

    const result = await store.deleteStory('s1')

    expect(result.success).toBe(true)
    expect(store.storiesFeed[0].stories).toHaveLength(1)
    expect(store.storiesFeed[0].stories.find(s => s._id === 's1')).toBeUndefined()
  })

  it('viewStory отправляет запрос на просмотр истории', async () => {
    const store = useStoriesStore()
    
    storyAPI.view.mockResolvedValue({})

    const result = await store.viewStory('s1')

    expect(storyAPI.view).toHaveBeenCalledWith('s1')
    expect(result.success).toBe(true)
  })

  it('openStory открывает историю для просмотра', () => {
    const store = useStoriesStore()
    
    store.openStory('user1', 2)

    expect(store.currentUsername).toBe('user1')
    expect(store.currentStoryIndex).toBe(2)
    expect(store.showCarousel).toBe(true)
  })

  it('nextStory переходит к следующей истории', () => {
    const store = useStoriesStore()
    store.storiesFeed = [
      {
        user: { username: 'user1' },
        stories: [
          { _id: 's1' },
          { _id: 's2' },
          { _id: 's3' }
        ]
      }
    ]
    store.currentUsername = 'user1'
    store.currentStoryIndex = 0

    store.nextStory()

    expect(store.currentStoryIndex).toBe(1)
  })

  it('nextStory переходит к следующему пользователю', () => {
    const store = useStoriesStore()
    store.storiesFeed = [
      {
        user: { username: 'user1' },
        stories: [{ _id: 's1' }]
      },
      {
        user: { username: 'user2' },
        stories: [{ _id: 's2' }, { _id: 's3' }]
      }
    ]
    store.currentUsername = 'user1'
    store.currentStoryIndex = 0

    store.nextStory()

    expect(store.currentUsername).toBe('user2')
    expect(store.currentStoryIndex).toBe(0)
  })

  it('prevStory переходит к предыдущей истории', () => {
    const store = useStoriesStore()
    store.storiesFeed = [
      {
        user: { username: 'user1' },
        stories: [
          { _id: 's1' },
          { _id: 's2' }
        ]
      }
    ]
    store.currentUsername = 'user1'
    store.currentStoryIndex = 1

    store.prevStory()

    expect(store.currentStoryIndex).toBe(0)
  })

  it('closeViewer закрывает просмотр историй', () => {
    const store = useStoriesStore()
    store.currentUsername = 'user1'
    store.currentStoryIndex = 5
    store.showCarousel = true

    store.closeViewer()

    expect(store.currentUsername).toBeNull()
    expect(store.currentStoryIndex).toBe(0)
    expect(store.showCarousel).toBe(false)
  })

  it('markAsViewed отмечает историю как просмотренную', () => {
    const store = useStoriesStore()
    
    store.markAsViewed('user1')

    expect(store.viewedStories.has('user1')).toBe(true)
  })

  it('isStoryViewed возвращает true если история просмотрена', () => {
    const store = useStoriesStore()
    store.viewedStories.add('user1')

    expect(store.isStoryViewed('user1')).toBe(true)
    expect(store.isStoryViewed('user2')).toBe(false)
  })

  it('hasStories возвращает true если есть истории', () => {
    const store = useStoriesStore()
    store.storiesFeed = [{ user: { username: 'user1' }, stories: [{ _id: 's1' }] }]

    expect(store.hasStories).toBe(true)
  })

  it('hasStories возвращает false если нет историй', () => {
    const store = useStoriesStore()
    store.storiesFeed = []

    expect(store.hasStories).toBe(false)
  })

  it('currentStory возвращает текущую историю', () => {
    const store = useStoriesStore()
    store.storiesFeed = [
      {
        user: { username: 'user1' },
        stories: [
          { _id: 's1', media: 'story1.jpg' },
          { _id: 's2', media: 'story2.jpg' }
        ]
      }
    ]
    store.currentUsername = 'user1'
    store.currentStoryIndex = 1

    expect(store.currentStory).toEqual({ _id: 's2', media: 'story2.jpg' })
  })

  it('currentStory возвращает null если нет текущей истории', () => {
    const store = useStoriesStore()
    store.currentUsername = null

    expect(store.currentStory).toBeNull()
  })
})
