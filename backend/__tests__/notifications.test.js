import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import app from '../server.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'

let mongoServer
let authToken
let testUser
let testUser2

describe('Notification Controller', () => {
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
    await Notification.deleteMany({})

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'notifuser',
        email: 'notif@example.com',
        password: 'password123',
        fullName: 'Notif User'
      })

    authToken = registerRes.body.accessToken
    testUser = await User.findOne({ email: 'notif@example.com' })

    testUser2 = await User.create({
      username: 'notifuser2',
      email: 'notif2@example.com',
      password: 'hashedpassword123',
      fullName: 'Notif User 2'
    })
  })

  describe('GET /api/notifications', () => {
    it('should return empty notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.notifications).toHaveLength(0)
    })

    it('should return user notifications', async () => {
      await Notification.create([
        {
          recipient: testUser._id,
          sender: testUser2._id,
          type: 'like',
          post: new mongoose.Types.ObjectId()
        },
        {
          recipient: testUser._id,
          sender: testUser2._id,
          type: 'follow'
        }
      ])

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.notifications).toHaveLength(2)
    })

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .get('/api/notifications')

      expect(res.status).toBe(401)
    })
  })

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notif = await Notification.create({
        recipient: testUser._id,
        sender: testUser2._id,
        type: 'like',
        isRead: false
      })

      const res = await request(app)
        .patch(`/api/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.notification.isRead).toBe(true)
    })

    it('should return 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app)
        .patch(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      await Notification.create([
        {
          recipient: testUser._id,
          sender: testUser2._id,
          type: 'like',
          isRead: false
        },
        {
          recipient: testUser._id,
          sender: testUser2._id,
          type: 'follow',
          isRead: false
        }
      ])

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)

      const unreadCount = await Notification.count({
        recipient: testUser._id,
        isRead: false
      })
      expect(unreadCount).toBe(0)
    })
  })

  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification', async () => {
      const notif = await Notification.create({
        recipient: testUser._id,
        sender: testUser2._id,
        type: 'like'
      })

      const res = await request(app)
        .delete(`/api/notifications/${notif._id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)

      const deletedNotif = await Notification.findById(notif._id)
      expect(deletedNotif).toBeNull()
    })
  })
})
