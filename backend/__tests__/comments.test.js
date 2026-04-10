import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../server.js'
import User from '../models/User.js'
import Post from '../models/Post.js'
import Comment from '../models/Comment.js'

let mongoServer
let authToken
let testUser
let testPost

describe('Comment Controller', () => {
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

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'commentuser',
        email: 'comment@example.com',
        password: 'password123',
        fullName: 'Comment User'
      })

    authToken = registerRes.body.accessToken
    testUser = await User.findOne({ email: 'comment@example.com' })

    // Создаём тестовый пост
    testPost = await Post.create({
      user: testUser._id,
      caption: 'Test post for comments',
      image: '/uploads/test.jpg'
    })
  })

  describe('POST /api/comments', () => {
    it('should create a comment', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postId: testPost._id.toString(),
          text: 'Great post!'
        })

      expect(res.status).toBe(201)
      expect(res.body.comment.text).toBe('Great post!')
      expect(res.body.comment.user._id).toBe(testUser._id.toString())
    })

    it('should return 400 if text is empty', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postId: testPost._id.toString(),
          text: ''
        })

      expect(res.status).toBe(400)
    })

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/comments')
        .send({
          postId: testPost._id.toString(),
          text: 'Great post!'
        })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/comments/:postId', () => {
    it('should get all comments for a post', async () => {
      await Comment.create([
        { user: testUser._id, post: testPost._id, text: 'Comment 1' },
        { user: testUser._id, post: testPost._id, text: 'Comment 2' }
      ])

      const res = await request(app)
        .get(`/api/comments/${testPost._id}`)

      expect(res.status).toBe(200)
      expect(res.body.comments).toHaveLength(2)
    })

    it('should return empty array for post without comments', async () => {
      const res = await request(app)
        .get(`/api/comments/${testPost._id}`)

      expect(res.status).toBe(200)
      expect(res.body.comments).toHaveLength(0)
    })
  })

  describe('DELETE /api/comments/:id', () => {
    it('should delete a comment', async () => {
      const comment = await Comment.create({
        user: testUser._id,
        post: testPost._id,
        text: 'Delete me'
      })

      const res = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Комментарий удален')

      const deletedComment = await Comment.findById(comment._id)
      expect(deletedComment).toBeNull()
    })

    it('should return 404 for non-existent comment', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .delete(`/api/comments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })
})
