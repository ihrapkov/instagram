import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import User from "../models/User.js";
import connectDB from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function createUser() {
  try {
    await connectDB();

    const existingUser = await User.findOne({
      $or: [{ username: "ihrapkov" }, { email: "ilhar2k@ya.ru" }],
    });

    if (existingUser) {
      console.log(
        "⚠️ Обновляю пароль существующего пользователя:",
        existingUser.username,
      );
      existingUser.password = "cfvjdjkmyfz";
      await existingUser.save();
      console.log("✅ Пароль обновлен");
      process.exit(0);
    }

    const user = await User.create({
      username: "ihrapkov",
      email: "ilhar2k@ya.ru",
      password: "cfvjdjkmyfz",
      fullName: "",
    });

    console.log(`✅ Пользователь создан: ${user.username} (${user.email})`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

createUser();
