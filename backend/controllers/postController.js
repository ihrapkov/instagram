import { validationResult } from 'express-validator'
import Post from '../models/Post.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'

// @desc    Получение ленты постов
// @route   GET /api/posts/feed
// @access  Private
export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Получаем посты от пользователей, на которых подписан
    const user = await User.findById(req.user._id)
      .populate({
        path: 'following',
        select: '_id'
      })

    const followingIds = user.following.map(f => f._id)
    followingIds.push(req.user._id) // Добавляем свои посты

    const posts = await Post.find({ user: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username avatar fullName')
      .populate('likes', 'username avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username avatar'
        }
      })

    const total = await Post.countDocuments({ user: { $in: followingIds } })

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    })
  } catch (error) {
    console.error('Get feed error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Создание поста
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { caption, location } = req.body

    if (!req.file) {
      return res.status(400).json({ message: 'Требуется изображение' })
    }

    const post = await Post.create({
      user: req.user._id,
      image: `/uploads/${req.file.filename}`,
      caption,
      location
    })

    const populatedPost = await Post.findById(post._id)
      .populate('user', 'username avatar fullName')

    res.status(201).json({
      message: 'Пост создан',
      post: populatedPost
    })
  } catch (error) {
    console.error('Create post error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Получение поста по ID
// @route   GET /api/posts/:id
// @access  Public
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username avatar fullName bio')
      .populate('likes', 'username avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username avatar'
        }
      })

    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' })
    }

    res.json(post)
  } catch (error) {
    console.error('Get post error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Удаление поста
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' })
    }

    // Проверка, что пользователь является владельцем поста
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав для удаления этого поста' })
    }

    await Post.findByIdAndDelete(req.params.id)

    res.json({ message: 'Пост удален' })
  } catch (error) {
    console.error('Delete post error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Лайк поста
// @route   POST /api/posts/:id/like
// @access  Private
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' })
    }

    // Проверка, не лайкнут ли уже
    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Пост уже лайкнут' })
    }

    post.likes.push(req.user._id)
    await post.save()

    // Создаем уведомление, если лайк не свой пост
    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: 'like',
        post: post._id
      })
    }

    res.json({ message: 'Пост лайкнут', likes: post.likes.length })
  } catch (error) {
    console.error('Like post error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Удаление лайка
// @route   POST /api/posts/:id/unlike
// @access  Private
export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' })
    }

    // Проверка, лайкнут ли
    if (!post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Пост еще не лайкнут' })
    }

    post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString())
    await post.save()

    res.json({ message: 'Лайк удален', likes: post.likes.length })
  } catch (error) {
    console.error('Unlike post error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Получение постов пользователя
// @route   GET /api/posts/user/:userId
// @access  Public
export const getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 9
    const skip = (page - 1) * limit

    const posts = await Post.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username avatar')
      .populate('likes', 'username avatar')

    const total = await Post.countDocuments({ user: req.params.userId })

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    })
  } catch (error) {
    console.error('Get user posts error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}
