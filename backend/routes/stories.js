import express from 'express'
import Story from '../models/Story.js'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = express.Router()

// @desc    Получение историй пользователя
// @route   GET /api/stories/:username
// @access  Private
router.get('/:username', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    const stories = await Story.find({
      user: user._id,
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar')
      .populate('views', 'username avatar')

    res.json(stories)
  } catch (error) {
    console.error('Get stories error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// @desc    Получение всех активных историй (для ленты stories)
// @route   GET /api/stories/
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Получаем пользователей, на которых подписан текущий пользователь
    const user = await User.findById(req.user._id)
      .populate('following', '_id username avatar')

    const followingIds = user.following.map(f => f._id)
    // Добавляем ID текущего пользователя (чтобы видеть свои истории)
    followingIds.push(req.user._id)

    // Получаем активные истории
    const stories = await Story.aggregate([
      {
        $match: {
          user: { $in: followingIds },
          expiresAt: { $gt: new Date() }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'users',
          localField: 'views',
          foreignField: '_id',
          as: 'views'
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$user._id',
          user: { $first: '$user' },
          stories: { $push: '$$ROOT' }
        }
      }
    ])

    res.json(stories)
  } catch (error) {
    console.error('Get all stories error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// @desc    Создание истории
// @route   POST /api/stories
// @access  Private
router.post('/', protect, upload.single('story'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Требуется изображение или видео' })
    }

    const isVideo = req.file.mimetype.startsWith('video/')

    const story = await Story.create({
      user: req.user._id,
      image: isVideo ? null : `/uploads/${req.file.filename}`,
      video: isVideo ? `/uploads/${req.file.filename}` : null,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 часов
    })

    const populatedStory = await Story.findById(story._id)
      .populate('user', 'username avatar')

    res.status(201).json({
      message: 'История создана',
      story: populatedStory
    })
  } catch (error) {
    console.error('Create story error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// @desc    Удаление истории
// @route   DELETE /api/stories/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)

    if (!story) {
      return res.status(404).json({ message: 'История не найдена' })
    }

    // Проверка, что пользователь является владельцем
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав для удаления этой истории' })
    }

    await Story.findByIdAndDelete(req.params.id)

    res.json({ message: 'История удалена' })
  } catch (error) {
    console.error('Delete story error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// @desc    Просмотр истории (добавление view)
// @route   POST /api/stories/:id/view
// @access  Private
router.post('/:id/view', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)

    if (!story) {
      return res.status(404).json({ message: 'История не найдена' })
    }

    // Добавляем просмотр, если еще не смотрели
    if (!story.views.includes(req.user._id)) {
      story.views.push(req.user._id)
      await story.save()
    }

    res.json({ message: 'Просмотр засчитан' })
  } catch (error) {
    console.error('View story error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router
