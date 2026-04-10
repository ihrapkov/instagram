import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Проверка JWT токена
export const protect = async (req, res, next) => {
  let token

  // Проверяем Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Получаем токен из header
      token = req.headers.authorization.split(' ')[1]

      // Проверяем токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Получаем пользователя из токена
      req.user = await User.findById(decoded.id).select('-password')

      if (!req.user) {
        return res.status(401).json({ message: 'Пользователь не найден' })
      }

      next()
    } catch (error) {
      console.error('Auth middleware error:', error)
      return res.status(401).json({ message: 'Неверный токен' })
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' })
  }
}

// Опциональная авторизация (не блокирует, если нет токена)
export const optionalAuth = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select('-password')
    } catch (error) {
      // Игнорируем ошибки, токен просто не валиден
    }
  }

  next()
}
