import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../server.js'
import User from '../models/User.js'
import Post from '../models/Post.js'
import Comment from '../models/Comment.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mongoServer
let authToken
let testUser

describe('Post Controller', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    process.env.MONGODB_URI = mongoUri
    process.env.JWT_SECRET = 'test-secret'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
    
    await mongoose.connect(mongoUri)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    if (mongoServer) {
      await mongoServer.stop()
    }
  })

  beforeEach(async () => {
    await User.deleteMany({})
    await Post.deleteMany({})
    await Comment.deleteMany({})

    // Создаём тестового пользователя и получаем токен
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'postuser',
        email: 'post@example.com',
        password: 'password123',
        fullName: 'Post User'
      })

    authToken = registerRes.body.accessToken
    testUser = registerRes.body.user
  })

  describe('POST /api/posts', () => {
    it('создание поста с изображением', async () => {
      // Создаём тестовый файл
      const testImagePath = path.join(__dirname, 'test-image.jpg')
      fs.writeFileSync(testImagePath, 'fake image content')

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .field('caption', 'Test post caption')
        .field('location', 'Test Location')

      expect(res.statusCode).toBe(201)
      expect(res.body).toHaveProperty('post')
      expect(res.body.post).toHaveProperty('caption', 'Test post caption')
      expect(res.body.post).toHaveProperty('user')
      expect(res.body.post.user.username).toBe('postuser')

      // Очищаем тестовый файл
      fs.unlinkSync(testImagePath)
    })

    it('ошибка создания поста без изображения', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .field('caption', 'Test caption')

      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Требуется изображение')
    })

    it('ошибка создания поста без авторизации', async () => {
      const res = await request(app)
        .post('/api/posts')
        .field('caption', 'Test caption')

      expect(res.statusCode).toBe(401)
    })
  })

  describe('GET /api/posts/:id', () => {
    let testPost

    beforeEach(async () => {
      testPost = await Post.create({
        user: testUser._id,
        image: '/uploads/test.jpg',
        caption: 'Test post'
      })
    })

    it('получение поста по ID', async () => {
      const res = await request(app)
        .get(`/api/posts/${testPost._id}`)

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('_id', testPost._id.toString())
      expect(res.body).toHaveProperty('caption', 'Test post')
    })

    it('ошибка получения несуществующего поста', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      
      const res = await request(app)
        .get(`/api/posts/${fakeId}`)

      expect(res.statusCode).toBe(404)
      expect(res.body.message).toBe('Пост не найден')
    })
  })

  describe('DELETE /api/posts/:id', () => {
    let testPost

    beforeEach(async () => {
      testPost = await Post.create({
        user: testUser._id,
        image: '/uploads/test.jpg',
        caption: 'Test post to delete'
      })
    })

    it('удаление своего поста', async () => {
      const res = await request(app)
        .delete(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Пост удален')

      const deletedPost = await Post.findById(testPost._id)
      expect(deletedPost).toBeNull()
    })

    it('ошибка удаления чужого поста', async () => {
      // Создаём другого пользователя
      const otherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          email: 'other@example.com',
          password: 'password123'
        })

      const otherToken = otherUserRes.body.accessToken

      const res = await request(app)
        .delete(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.statusCode).toBe(403)
      expect(res.body.message).toBe('Нет прав для удаления этого поста')
    })
  })

  describe('POST /api/posts/:id/like', () => {
    let testPost

    beforeEach(async () => {
      testPost = await Post.create({
        user: testUser._id,
        image: '/uploads/test.jpg',
        caption: 'Test post'
      })
    })

    it('лайк поста', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Пост лайкнут')
      expect(res.body.likes).toBe(1)
    })

    it('ошибка повторного лайка', async () => {
      await request(app)
        .post(`/api/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${authToken}`)

      const res = await request(app)
        .post(`/api/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Пост уже лайкнут')
    })
  })

  describe('POST /api/posts/:id/unlike', () => {
    let testPost

    beforeEach(async () => {
      testPost = await Post.create({
        user: testUser._id,
        image: '/uploads/test.jpg',
        caption: 'Test post',
        likes: [testUser._id]
      })
    })

    it('удаление лайка', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost._id}/unlike`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.message).toBe('Лайк удален')
      expect(res.body.likes).toBe(0)
    })

    it('ошибка удаления лайка с нелайкнутого поста', async () => {
      const otherUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser2',
          email: 'other2@example.com',
          password: 'password123'
        })

      const otherToken = otherUserRes.body.accessToken

      const res = await request(app)
        .post(`/api/posts/${testPost._id}/unlike`)
        .set('Authorization', `Bearer ${otherToken}`)

      expect(res.statusCode).toBe(400)
      expect(res.body.message).toBe('Пост еще не лайкнут')
    })
  })

  describe('GET /api/posts/feed', () => {
    beforeEach(async () => {
      // Создаём посты
      await Post.create([
        {
          user: testUser._id,
          image: '/uploads/post1.jpg',
          caption: 'My post 1'
        },
        {
          user: testUser._id,
          image: '/uploads/post2.jpg',
          caption: 'My post 2'
        }
      ])
    })

    it('получение ленты постов', async () => {
      const res = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('posts')
      expect(res.body.posts.length).toBe(2)
      expect(res.body).toHaveProperty('currentPage', 1)
      expect(res.body).toHaveProperty('totalPages', 1)
    })
  })

  describe('GET /api/posts/user/:userId', () => {
    beforeEach(async () => {
      await Post.create([
        {
          user: testUser._id,
          image: '/uploads/post1.jpg',
          caption: 'User post 1'
        },
        {
          user: testUser._id,
          image: '/uploads/post2.jpg',
          caption: 'User post 2'
        }
      ])
    })

    it('получение постов пользователя', async () => {
      const res = await request(app)
        .get(`/api/posts/user/${testUser._id}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.posts.length).toBe(2)
      expect(res.body).toHaveProperty('totalPosts', 2)
    })
  })
})
