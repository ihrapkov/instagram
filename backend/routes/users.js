import express from "express";
import { body } from "express-validator";
import User from "../models/User.js";
import {
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  searchUsers,
  uploadAvatar,
  deleteAvatar,
} from "../controllers/userController.js";
import { protect, optionalAuth } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Валидация для обновления профиля
const updateProfileValidation = [
  body("fullName").optional().trim().isLength({ max: 50 }),
  body("bio").optional().trim().isLength({ max: 150 }),
  body("website").optional().trim().isURL(),
];

// DEBUG: просмотр всех пользователей (удалить в продакшене!)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/search", protect, searchUsers);
router.get("/:username", optionalAuth, getUserProfile);
router.put("/profile", protect, updateProfileValidation, updateProfile);
router.put("/avatar", protect, upload.single("avatar"), uploadAvatar);
router.delete("/avatar", protect, deleteAvatar);
router.post("/:id/follow", protect, followUser);
router.post("/:id/unfollow", protect, unfollowUser);

export default router;
