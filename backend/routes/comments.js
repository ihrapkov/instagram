import express from 'express'
import { body } from 'express-validator'
import {
  addComment,
  getComments,
  deleteComment,
  likeComment,
  unlikeComment
} from '../controllers/commentController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Валидация
const addCommentValidation = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Комментарий должен быть от 1 до 300 символов'),
  body('postId')
    .notEmpty()
    .withMessage('Требуется ID поста')
]

router.post('/', protect, addCommentValidation, addComment)
router.get('/:postId', getComments)
router.delete('/:id', protect, deleteComment)
router.post('/:id/like', protect, likeComment)
router.post('/:id/unlike', protect, unlikeComment)

export default router
