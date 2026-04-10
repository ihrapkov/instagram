# Instagram Backend API

Бэкенд для Instagram-клона на Node.js + Express + MongoDB.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Настройка окружения

Скопируйте `.env.example` в `.env` и настройте переменные:

```bash
cp .env.example .env
```

**Обязательно измените:**
- `JWT_SECRET` — случайная строка для JWT токенов
- `JWT_REFRESH_SECRET` — случайная строка для refresh токенов
- `MONGODB_URI` — подключение к MongoDB

### 3. Запуск MongoDB

Убедитесь, что MongoDB запущен:

```bash
# Windows (если MongoDB установлена как сервис)
net start MongoDB

# macOS (через brew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 4. Запуск сервера

```bash
# Режим разработки (с авто-рестартом)
npm run dev

# Продакшен режим
npm start
```

Сервер запустится на `http://localhost:5000`

---

## 📡 API Endpoints

### Auth (Аутентификация)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/refresh` | Refresh токена |
| POST | `/api/auth/logout` | Выход |

### Users (Пользователи)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/users/:username` | Профиль |
| PUT | `/api/users/profile` | Редактирование |
| POST | `/api/users/:id/follow` | Подписка |
| POST | `/api/users/:id/unfollow` | Отписка |
| GET | `/api/users/search?q=...` | Поиск |

### Posts (Посты)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/posts/feed` | Лента |
| POST | `/api/posts` | Создать пост |
| GET | `/api/posts/:id` | Пост |
| DELETE | `/api/posts/:id` | Удалить пост |
| POST | `/api/posts/:id/like` | Лайк |
| POST | `/api/posts/:id/unlike` | Удалить лайк |

### Stories (Истории)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/stories` | Все истории (лента) |
| GET | `/api/stories/:username` | Истории пользователя |
| POST | `/api/stories` | Создать историю |
| DELETE | `/api/stories/:id` | Удалить историю |
| POST | `/api/stories/:id/view` | Просмотр |

---

## 📝 Примеры запросов

### Регистрация

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### Вход

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Создание поста (с изображением)

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "caption=Мой первый пост!"
```

---

## 🗂 Структура проекта

```
backend/
├── config/          # Конфигурация (DB и т.д.)
├── controllers/     # Бизнес-логика
├── middleware/      # Middleware (auth, upload)
├── models/          # Mongoose модели
├── routes/          # API маршруты
├── uploads/         # Загруженные файлы
├── .env             # Переменные окружения
├── .env.example     # Шаблон переменных
└── server.js        # Точка входа
```

---

## 🔧 Технологии

- **Node.js** — runtime
- **Express** — веб-фреймворк
- **MongoDB + Mongoose** — база данных
- **JWT** — аутентификация
- **bcryptjs** — хеширование паролей
- **Multer** — загрузка файлов
- **express-validator** — валидация

---

## 📦 Зависимости

```json
{
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.21.2",
  "express-validator": "^7.2.1",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.9.5",
  "multer": "^1.4.5-lts.1"
}
```
