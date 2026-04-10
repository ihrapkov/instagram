import express from 'express'
import { body } from 'express-validator'
import { register, login, refreshToken, logout } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Валидация для регистрации
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Имя пользователя должно быть от 3 до 30 символов'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Введите корректный email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен быть не менее 6 символов'),
  body('fullName').optional().trim().isLength({ max: 50 })
]

// Валидация для входа
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Введите email или имя пользователя'),
  body('password')
    .notEmpty()
    .withMessage('Введите пароль')
]

router.post('/register', registerValidation, register)
router.post('/login', loginValidation, login)
router.post('/refresh', refreshToken)
router.post('/logout', protect, logout)

export default router
