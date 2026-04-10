import Notification from '../models/Notification.js'

// @desc    Получение уведомлений пользователя
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('post', 'image')
      .populate('comment', 'text')

    const total = await Notification.countDocuments({ recipient: req.user._id })
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    })

    res.json({
      notifications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      unreadCount
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Отметить уведомление как прочитанное
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ message: 'Уведомление не найдено' })
    }

    // Проверка, что уведомление принадлежит пользователю
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав' })
    }

    notification.isRead = true
    await notification.save()

    res.json({ message: 'Уведомление отмечено как прочитанное' })
  } catch (error) {
    console.error('Mark as read error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Отметить все уведомления как прочитанные
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    )

    res.json({ message: 'Все уведомления отмечены как прочитанные' })
  } catch (error) {
    console.error('Mark all as read error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Удаление уведомления
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ message: 'Уведомление не найдено' })
    }

    // Проверка, что уведомление принадлежит пользователю
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав' })
    }

    await Notification.findByIdAndDelete(req.params.id)

    res.json({ message: 'Уведомление удалено' })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Создание уведомления (внутренний API)
// @route   POST /api/notifications
// @access  Private
export const createNotification = async (req, res) => {
  try {
    const { recipient, sender, type, post, comment, text } = req.body

    // Проверка на существование похожего уведомления (для лайков)
    if (type === 'like') {
      const existingNotification = await Notification.findOne({
        recipient,
        sender,
        type,
        post
      })

      if (existingNotification) {
        // Обновляем существующее (помечаем как непрочитанное)
        existingNotification.isRead = false
        existingNotification.createdAt = new Date()
        await existingNotification.save()
        return res.json(existingNotification)
      }
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      post,
      comment,
      text
    })

    res.status(201).json(notification)
  } catch (error) {
    console.error('Create notification error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}
