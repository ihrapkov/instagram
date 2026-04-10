import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    website: {
      type: String,
      trim: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    refreshToken: {
      type: String,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Хеширование пароля перед сохранением
userSchema.pre("save", async function (next) {
  // Хешируем пароль только если он был изменён (новый или обновляется)
  if (!this.isModified("password")) return next();

  // Проверяем, не является ли пароль уже хешем bcrypt
  // (чтобы избежать двойного хеширования при повторных save())
  const bcryptRegex = /^\$2[aby]?\$\d{1,2}\$/;
  if (bcryptRegex.test(this.password)) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Метод для сравнения паролей
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Метод для получения публичного профиля
userSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
