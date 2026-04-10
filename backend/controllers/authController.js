import jwt from 'jsonwebtoken'
import { validationResult } from 'express-validator'
import User from '../models/User.js'

// Генерация токенов
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  })

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  })

  return { accessToken, refreshToken }
}

// @desc    Регистрация пользователя
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array())
      return res.status(400).json({ 
        message: 'Ошибка валидации',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
      })
    }

    const { username, email, password, fullName } = req.body

    console.log('Register attempt:', { username, email, fullName: !!fullName })

    // Проверка существующего пользователя
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email
          ? 'Email уже зарегистрирован'
          : 'Имя пользователя уже занято'
      })
    }

    // Создание пользователя
    const user = await User.create({
      username,
      email,
      password,
      fullName
    })

    // Генерация токенов
    const { accessToken, refreshToken } = generateTokens(user._id)

    // Сохранение refresh токена
    user.refreshToken = refreshToken
    await user.save()

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      accessToken,
      refreshToken,
      user: user.getPublicProfile()
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Ошибка сервера при регистрации' })
  }
}

// @desc    Вход пользователя
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Поиск пользователя по email или username
    const user = await User.findOne({
      $or: [
        { email: email },
        { username: email }
      ]
    })
    
    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' })
    }

    // Проверка пароля
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный email или пароль' })
    }

    // Генерация токенов
    const { accessToken, refreshToken } = generateTokens(user._id)

    // Сохранение refresh токена
    user.refreshToken = refreshToken
    await user.save()

    res.json({
      message: 'Успешный вход',
      accessToken,
      refreshToken,
      user: user.getPublicProfile()
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Ошибка сервера при входе' })
  }
}

// @desc    Обновление токенов
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({ message: 'Требуется refresh токен' })
    }

    // Проверка refresh токена
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    // Поиск пользователя
    const user = await User.findById(decoded.id)
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Неверный refresh токен' })
    }

    // Генерация новых токенов
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id)

    // Сохранение нового refresh токена
    user.refreshToken = newRefreshToken
    await user.save()

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    res.status(401).json({ message: 'Неверный refresh токен' })
  }
}

// @desc    Выход пользователя
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    req.user.refreshToken = null
    await req.user.save()

    res.json({ message: 'Успешный выход' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ message: 'Ошибка сервера при выходе' })
  }
}
