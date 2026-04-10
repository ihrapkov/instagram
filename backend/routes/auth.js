import express from "express";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Rate limiting для auth-эндпоинтов
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20, // 20 запросов
  message: { message: "Слишком много попыток. Попробуйте позже." },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: "Слишком много попыток. Попробуйте позже." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Валидация для регистрации
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Имя пользователя должно быть от 3 до 30 символов"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Введите корректный email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Пароль должен быть не менее 6 символов"),
  body("fullName").optional().trim().isLength({ max: 50 }),
];

// Валидация для входа
const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Введите email или имя пользователя"),
  body("password").notEmpty().withMessage("Введите пароль"),
];

router.post("/register", authLimiter, registerValidation, register);
router.post("/login", authLimiter, loginValidation, login);
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", protect, logout);

export default router;
