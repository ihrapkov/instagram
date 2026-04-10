import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCommentsStore } from '@/stores/comments'
import { commentAPI } from '@/api/axios'

// Мокаем API модули
vi.mock('@/api/axios', () => ({
  commentAPI: {
    getComments: vi.fn(),
    addComment: vi.fn(),
    deleteComment: vi.fn(),
    likeComment: vi.fn(),
    unlikeComment: vi.fn()
  }
}))

describe('Comments Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.getItem.mockReturnValue(null)
  })

  it('инициализируется с начальным состоянием', () => {
    const store = useCommentsStore()
    
    expect(store.commentsByPost).toEqual({})
  })

  it('fetchComments загружает комментарии для поста', async () => {
    const store = useCommentsStore()
    const mockComments = [
      { _id: '1', text: 'Comment 1', user: { username: 'user1' } },
      { _id: '2', text: 'Comment 2', user: { username: 'user2' } }
    ]
    
    commentAPI.getComments.mockResolvedValue({ data: mockComments })

    const result = await store.fetchComments('post1')

    expect(commentAPI.getComments).toHaveBeenCalledWith('post1')
    expect(result.success).toBe(true)
    expect(store.commentsByPost['post1']).toEqual(mockComments)
  })

  it('fetchComments обрабатывает ошибку', async () => {
    const store = useCommentsStore()
    const mockError = {
      response: {
        data: {
          message: 'Ошибка загрузки комментариев'
        }
      }
    }
    
    commentAPI.getComments.mockRejectedValue(mockError)

    const result = await store.fetchComments('post1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Ошибка загрузки комментариев')
  })

  it('addComment добавляет комментарий к посту', async () => {
    const store = useCommentsStore()
    const mockComment = {
      _id: '1',
      text: 'New comment',
      user: { username: 'user1' }
    }
    
    commentAPI.addComment.mockResolvedValue({ data: { comment: mockComment } })

    const result = await store.addComment('post1', 'New comment')

    expect(commentAPI.addComment).toHaveBeenCalledWith('post1', 'New comment')
    expect(result.success).toBe(true)
    expect(result.comment).toEqual(mockComment)
    expect(store.commentsByPost['post1']).toHaveLength(1)
    expect(store.commentsByPost['post1'][0]).toEqual(mockComment)
  })

  it('addComment создаёт массив если его нет', async () => {
    const store = useCommentsStore()
    const mockComment = {
      _id: '1',
      text: 'First comment',
      user: { username: 'user1' }
    }
    
    commentAPI.addComment.mockResolvedValue({ data: { comment: mockComment } })

    await store.addComment('post2', 'First comment')

    expect(store.commentsByPost['post2']).toBeDefined()
    expect(store.commentsByPost['post2']).toHaveLength(1)
  })

  it('deleteComment удаляет комментарий из кэша', async () => {
    const store = useCommentsStore()
    store.commentsByPost['post1'] = [
      { _id: '1', text: 'Comment 1' },
      { _id: '2', text: 'Comment 2' },
      { _id: '3', text: 'Comment 3' }
    ]

    commentAPI.deleteComment.mockResolvedValue({})

    const result = await store.deleteComment('post1', '2')

    expect(commentAPI.deleteComment).toHaveBeenCalledWith('2')
    expect(result.success).toBe(true)
    expect(store.commentsByPost['post1']).toHaveLength(2)
    expect(store.commentsByPost['post1'].find(c => c._id === '2')).toBeUndefined()
  })

  it('likeComment добавляет лайк к комментарию', async () => {
    const store = useCommentsStore()
    store.commentsByPost['post1'] = [
      { _id: '1', text: 'Comment 1', likes: [] }
    ]

    const mockResponse = {
      data: {
        likes: 5
      }
    }
    
    commentAPI.likeComment.mockResolvedValue(mockResponse)
    
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify({ _id: 'user1' })
      return null
    })

    const result = await store.likeComment('post1', '1')

    expect(result.success).toBe(true)
    expect(result.likes).toBe(5)
    expect(store.commentsByPost['post1'][0].likes).toHaveLength(1)
    expect(store.commentsByPost['post1'][0].likes[0]._id).toBe('user1')
  })

  it('unlikeComment удаляет лайк с комментария', async () => {
    const store = useCommentsStore()
    store.commentsByPost['post1'] = [
      { 
        _id: '1', 
        text: 'Comment 1', 
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
    
    commentAPI.unlikeComment.mockResolvedValue(mockResponse)
    
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify({ _id: 'user1' })
      return null
    })

    const result = await store.unlikeComment('post1', '1')

    expect(result.success).toBe(true)
    expect(store.commentsByPost['post1'][0].likes).toHaveLength(1)
    expect(store.commentsByPost['post1'][0].likes.find(like => like._id === 'user1')).toBeUndefined()
  })

  it('getCommentsByPost возвращает комментарии для поста', () => {
    const store = useCommentsStore()
    const mockComments = [
      { _id: '1', text: 'Comment 1' }
    ]
    
    store.commentsByPost['post1'] = mockComments

    expect(store.getCommentsByPost('post1')).toEqual(mockComments)
  })

  it('getCommentsByPost возвращает пустой массив если нет комментариев', () => {
    const store = useCommentsStore()

    expect(store.getCommentsByPost('post999')).toEqual([])
  })
})
