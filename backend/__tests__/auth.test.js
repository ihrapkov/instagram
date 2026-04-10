import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../server.js";
import User from "../models/User.js";
import Post from "../models/Post.js";

let mongoServer;

describe("Auth Controller", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

    // Подключаемся к тестовой БД
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    it("успешная регистрация пользователя", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        fullName: "Test User",
      };

      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.user).toHaveProperty("username", "testuser");
      expect(res.body.user).toHaveProperty("email", "test@example.com");
      expect(res.body.user).not.toHaveProperty("password");
    });

    it("ошибка валидации при регистрации", async () => {
      const userData = {
        username: "te",
        email: "invalid-email",
        password: "123",
      };

      const res = await request(app).post("/api/auth/register").send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message", "Ошибка валидации");
    });

    it("ошибка при регистрации существующего email", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      await request(app).post("/api/auth/register").send(userData);

      const res = await request(app).post("/api/auth/register").send({
        username: "anotheruser",
        email: "test@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Email уже зарегистрирован");
    });

    it("ошибка при регистрации существующего username", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      await request(app).post("/api/auth/register").send(userData);

      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "another@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Имя пользователя уже занято");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        username: "loginuser",
        email: "login@example.com",
        password: "password123",
        fullName: "Login User",
      });
    });

    it("успешный вход по email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.user).toHaveProperty("username", "loginuser");
    });

    it("успешный вход по username", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "loginuser",
        password: "password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
    });

    it("ошибка входа с неверным паролем", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Неверный email или пароль");
    });

    it("ошибка входа с несуществующим email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Неверный email или пароль");
    });
  });

  describe("POST /api/auth/refresh", () => {
    let refreshToken;

    beforeEach(async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "refreshuser",
        email: "refresh@example.com",
        password: "password123",
      });

      refreshToken = res.body.refreshToken;
    });

    it("успешное обновление токена", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.refreshToken).not.toBe(refreshToken);
    });

    it("ошибка при отсутствии refresh токена", async () => {
      const res = await request(app).post("/api/auth/refresh").send({});

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Требуется refresh токен");
    });

    it("ошибка при неверном refresh токене", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "invalid-token" });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Неверный refresh токен");
    });
  });
});
