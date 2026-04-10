import mongoose from 'mongoose'

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    image: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 2200
    },
    location: {
      type: String,
      trim: true
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
      }
    ]
  },
  {
    timestamps: true
  }
)

// Индекс для ленты по дате
postSchema.index({ createdAt: -1 })

const Post = mongoose.model('Post', postSchema)

export default Post
