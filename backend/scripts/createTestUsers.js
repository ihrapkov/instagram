import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import User from "../models/User.js";
import Post from "../models/Post.js";
import connectDB from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Тестовые пользователи
const testUsers = [
  {
    username: "alice_wonder",
    email: "alice@example.com",
    password: "password123",
    fullName: "Alice Wonder",
    bio: "Путешественница 🌍 | Фотограф 📸",
    avatar: "",
  },
  {
    username: "john_doe",
    email: "john@example.com",
    password: "password123",
    fullName: "John Doe",
    bio: "Разработчик | Люблю кофе ☕",
    avatar: "",
  },
  {
    username: "marry_jane",
    email: "marry@example.com",
    password: "password123",
    fullName: "Marry Jane",
    bio: "Дизайнер | Искусство 🎨",
    avatar: "",
  },
  {
    username: "mike_tyson",
    email: "mike@example.com",
    password: "password123",
    fullName: "Mike Tyson",
    bio: "Спортсмен | Мотиватор 💪",
    avatar: "",
  },
  {
    username: "emma_stone",
    email: "emma@example.com",
    password: "password123",
    fullName: "Emma Stone",
    bio: "Актриса | Лос-Анджелес 🎬",
    avatar: "",
  },
];

async function createTestUsers() {
  try {
    await connectDB();

    // Очищаем старых тестовых пользователей
    const emails = testUsers.map((u) => u.email);
    await User.deleteMany({ email: { $in: emails } });
    console.log("✅ Старые тестовые пользователи удалены");

    // Создаём новых пользователей
    const createdUsers = [];
    for (const userData of testUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`✅ Создан пользователь: ${user.username}`);
    }

    // Создаём тестовые посты для некоторых пользователей
    const samplePosts = [
      {
        user: createdUsers[0]._id,
        caption: "Прекрасный закат! 🌅",
        image: "https://picsum.photos/seed/sunset/600/600",
        location: "Париж, Франция",
      },
      {
        user: createdUsers[1]._id,
        caption: "Мой рабочий стол 💻 #coding",
        image: "https://picsum.photos/seed/desk/600/600",
      },
      {
        user: createdUsers[2]._id,
        caption: "Новая картина готова! 🎨",
        image: "https://picsum.photos/seed/art/600/600",
      },
      {
        user: createdUsers[3]._id,
        caption: "Тренировка прошла успешно! 💪",
        image: "https://picsum.photos/seed/gym/600/600",
        location: "Спортзал",
      },
      {
        user: createdUsers[4]._id,
        caption: "За кадром 🎬",
        image: "https://picsum.photos/seed/movie/600/600",
        location: "Голливуд",
      },
    ];

    await Post.deleteMany({ user: { $in: createdUsers.map((u) => u._id) } });

    for (const postData of samplePosts) {
      await Post.create(postData);
    }
    console.log("✅ Созданы тестовые посты");

    // Настраиваем подписки между пользователями
    // alice подписана на john и marry
    createdUsers[0].following = [createdUsers[1]._id, createdUsers[2]._id];
    createdUsers[0].followers = [createdUsers[3]._id, createdUsers[4]._id];

    // john подписан на alice и marry
    createdUsers[1].following = [createdUsers[0]._id, createdUsers[2]._id];
    createdUsers[1].followers = [createdUsers[0]._id, createdUsers[3]._id];

    // marry подписана на john
    createdUsers[2].following = [createdUsers[1]._id];
    createdUsers[2].followers = [
      createdUsers[0]._id,
      createdUsers[1]._id,
      createdUsers[4]._id,
    ];

    // mike подписан на alice и john
    createdUsers[3].following = [createdUsers[0]._id, createdUsers[1]._id];
    createdUsers[3].followers = [createdUsers[0]._id];

    // emma подписана на marry
    createdUsers[4].following = [createdUsers[2]._id];
    createdUsers[4].followers = [createdUsers[0]._id];

    for (const user of createdUsers) {
      await user.save();
    }
    console.log("✅ Настроены тестовые подписки");

    console.log("\n📋 Тестовые пользователи:");
    console.log("─".repeat(50));
    testUsers.forEach((u, i) => {
      const user = createdUsers[i];
      console.log(`\n${i + 1}. ${u.username}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Пароль: password123`);
      console.log(`   Подписчики: ${user.followers.length}`);
      console.log(`   Подписки: ${user.following.length}`);
    });
    console.log("\n✅ Готово! Можно тестировать подписки!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

createTestUsers();
