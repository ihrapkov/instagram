import express from 'express'
import { body } from 'express-validator'
import {
  getFeed,
  createPost,
  getPost,
  deletePost,
  likePost,
  unlikePost,
  getUserPosts
} from '../controllers/postController.js'
import { protect } from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = express.Router()

// Валидация для создания поста
const createPostValidation = [
  body('caption').optional().trim().isLength({ max: 2200 }),
  body('location').optional().trim()
]

router.get('/feed', protect, getFeed)
router.get('/user/:userId', getUserPosts)
router.get('/:id', getPost)
router.post('/', protect, upload.single('image'), createPostValidation, createPost)
router.delete('/:id', protect, deletePost)
router.post('/:id/like', protect, likePost)
router.post('/:id/unlike', protect, unlikePost)

export default router
