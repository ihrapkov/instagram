import { validationResult } from 'express-validator'
import User from '../models/User.js'
import Post from '../models/Post.js'
import Notification from '../models/Notification.js'

// @desc    Получение профиля пользователя
// @route   GET /api/users/:username
// @access  Public
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar')

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    // Получаем посты пользователя
    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar')
      .populate('likes', 'username avatar')

    res.json({
      user: {
        ...user.getPublicProfile(),
        postsCount: posts.length,
        followersCount: user.followers.length,
        followingCount: user.following.length
      },
      posts
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Редактирование профиля
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { fullName, bio, website } = req.body

    const user = await User.findById(req.user._id)

    if (req.body.fullName) user.fullName = fullName
    if (req.body.bio !== undefined) user.bio = bio
    if (req.body.website !== undefined) user.website = website

    await user.save()

    res.json({
      message: 'Профиль обновлен',
      user: user.getPublicProfile()
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Загрузка аватара
// @route   PUT /api/users/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Требуется изображение' })
    }

    const user = await User.findById(req.user._id)
    user.avatar = `/uploads/${req.file.filename}`
    await user.save()

    res.json({
      message: 'Аватар загружен',
      avatar: user.avatar
    })
  } catch (error) {
    console.error('Upload avatar error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Удаление аватара
// @route   DELETE /api/users/avatar
// @access  Private
export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    user.avatar = ''
    await user.save()

    res.json({ message: 'Аватар удален' })
  } catch (error) {
    console.error('Delete avatar error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Подписка на пользователя
// @route   POST /api/users/:id/follow
// @access  Private
export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id)

    if (!userToFollow) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    if (userToFollow._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Нельзя подписаться на себя' })
    }

    const currentUser = await User.findById(req.user._id)

    // Проверка, не подписан ли уже
    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({ message: 'Вы уже подписаны на этого пользователя' })
    }

    // Добавляем подписку
    currentUser.following.push(userToFollow._id)
    userToFollow.followers.push(currentUser._id)

    await currentUser.save()
    await userToFollow.save()

    // Создаем уведомление о подписке
    await Notification.create({
      recipient: userToFollow._id,
      sender: currentUser._id,
      type: 'follow'
    })

    res.json({ message: 'Вы подписались на пользователя' })
  } catch (error) {
    console.error('Follow user error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Отписка от пользователя
// @route   POST /api/users/:id/unfollow
// @access  Private
export const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id)

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    const currentUser = await User.findById(req.user._id)

    // Проверка, подписан ли
    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res.status(400).json({ message: 'Вы не подписаны на этого пользователя' })
    }

    // Удаляем подписку
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userToUnfollow._id.toString()
    )
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUser._id.toString()
    )

    await currentUser.save()
    await userToUnfollow.save()

    res.json({ message: 'Вы отписались от пользователя' })
  } catch (error) {
    console.error('Unfollow user error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Поиск пользователей
// @route   GET /api/users/search
// @access  Private
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query

    if (!q) {
      return res.status(400).json({ message: 'Требуется поисковый запрос' })
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
      ]
    })
      .select('username avatar fullName')
      .limit(20)

    res.json(users)
  } catch (error) {
    console.error('Search users error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}
