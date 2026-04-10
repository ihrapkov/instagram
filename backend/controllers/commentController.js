import { validationResult } from 'express-validator'
import Comment from '../models/Comment.js'
import Post from '../models/Post.js'
import Notification from '../models/Notification.js'

// @desc    Добавление комментария
// @route   POST /api/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { postId, text } = req.body

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Комментарий не может быть пустым' })
    }

    // Проверяем существование поста
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' })
    }

    // Создаём комментарий
    const comment = await Comment.create({
      post: postId,
      user: req.user._id,
      text: text.trim()
    })

    // Добавляем комментарий к посту
    post.comments.push(comment._id)
    await post.save()

    // Создаем уведомление владельцу поста, если комментарий не свой
    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        comment: comment._id,
        text: text.trim()
      })
    }

    // Возвращаем комментарий с данными пользователя
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username avatar')

    res.status(201).json({
      message: 'Комментарий добавлен',
      comment: populatedComment
    })
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Получение комментариев поста
// @route   GET /api/comments/:postId
// @access  Public
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: 1 })
      .populate('user', 'username avatar')

    res.json(comments)
  } catch (error) {
    console.error('Get comments error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Удаление комментария
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({ message: 'Комментарий не найден' })
    }

    // Проверка: владелец комментария или поста может удалить
    const post = await Post.findById(comment.post)
    const isCommentOwner = comment.user.toString() === req.user._id.toString()
    const isPostOwner = post.user.toString() === req.user._id.toString()

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({ message: 'Нет прав для удаления' })
    }

    // Удаляем комментарий
    await Comment.findByIdAndDelete(req.params.id)

    // Удаляем из поста
    post.comments = post.comments.filter(id => id.toString() !== comment._id.toString())
    await post.save()

    res.json({ message: 'Комментарий удален' })
  } catch (error) {
    console.error('Delete comment error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Лайк комментария
// @route   POST /api/comments/:id/like
// @access  Private
export const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({ message: 'Комментарий не найден' })
    }

    if (comment.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Комментарий уже лайкнут' })
    }

    comment.likes.push(req.user._id)
    await comment.save()

    // Создаем уведомление владельцу комментария, если лайк не свой
    if (comment.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: comment.user,
        sender: req.user._id,
        type: 'like_comment',
        comment: comment._id,
        post: comment.post
      })
    }

    res.json({ message: 'Комментарий лайкнут', likes: comment.likes.length })
  } catch (error) {
    console.error('Like comment error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

// @desc    Удаление лайка комментария
// @route   POST /api/comments/:id/unlike
// @access  Private
export const unlikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({ message: 'Комментарий не найден' })
    }

    comment.likes = comment.likes.filter(id => id.toString() !== req.user._id.toString())
    await comment.save()

    res.json({ message: 'Лайк удален', likes: comment.likes.length })
  } catch (error) {
    console.error('Unlike comment error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}
