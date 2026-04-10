# Instagram Clone

Полнофункциональный аналог Instagram — веб-приложение для публикации фотографий с фильтрами, историями, системой аутентификации и социальными функциями.

---

## 📸 Возможности

### Публикации

- **Пошаговое создание** — 3 этапа: загрузка → фильтры → описание
- **11 Instagram-фильтров** (CSSgram): Clarendon, Gingham, Moon, Lark, Reyes, Juno, Slumber, Crema, Ludwig, Aden
- **Регулировка интенсивности** фильтра (0–100%)
- **Масштабирование** изображения (50%–300%) с ползунком
- **Кадрирование** — пропорции: Оригинал, 1:1, 4:5, 16:9
- **Перетаскивание** фото для центрирования (долгое нажатие + сетка 3×3)
- **Геопозиция** — автоматическое определение координат
- **Описание** до 2200 символов со счётчиком
- **Drag & Drop** загрузка

### Истории (Stories)

- Создание и просмотр историй
- Карусель историй в ленте
- Полноэкранный просмотрщик

### Социальные функции

- **Лайки** с анимацией
- **Комментарии** к публикациям
- **Подписки** на пользователей
- **Уведомления** о взаимодействиях
- **Лента** публикаций подписок

### Профиль

- Просмотр собственных и чужих профилей
- Редактирование профиля и аватара
- Сетка публикаций пользователя

### Аутентификация

- Регистрация и вход
- JWT-токены с автоматическим обновлением
- Защита маршрутов

---

## 🛠 Технологии

### Frontend

| Технология                  | Назначение                   |
| --------------------------- | ---------------------------- |
| **Vue 3** (Composition API) | Фреймворк UI                 |
| **Pinia**                   | Управление состоянием        |
| **Vue Router**              | Маршрутизация                |
| **Axios**                   | HTTP-клиент с интерцепторами |
| **Element Plus**            | UI-компоненты                |
| **CSSgram**                 | Instagram-фильтры            |
| **Sass**                    | Препроцессор CSS             |
| **Vite**                    | Сборщик и dev-сервер         |

### Backend

| Технология             | Назначение             |
| ---------------------- | ---------------------- |
| **Node.js + Express**  | API-сервер             |
| **MongoDB + Mongoose** | База данных            |
| **JWT**                | Аутентификация         |
| **Bcrypt**             | Хеширование паролей    |
| **Multer**             | Загрузка файлов        |
| **Express Validator**  | Валидация данных       |
| **CORS**               | Кросс-доменные запросы |

---

## 📁 Структура проекта

```
instagram/
├── backend/                    # Express API
│   ├── config/
│   │   └── database.js        # Подключение к MongoDB
│   ├── controllers/
│   │   ├── authController.js  # Регистрация, вход, logout
│   │   ├── userController.js  # Профиль, аватар, подписки
│   │   ├── postController.js  # CRUD публикаций, лайки
│   │   ├── commentController.js
│   │   └── notificationController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT-защита, refresh token
│   │   └── upload.js          # Multer настройка
│   ├── models/
│   │   ├── User.js            # Модель пользователя
│   │   ├── Post.js            # Модель публикации
│   │   ├── Comment.js         # Модель комментария
│   │   ├── Story.js           # Модель истории
│   │   └── Notification.js    # Модель уведомления
│   ├── routes/                # API маршруты
│   ├── uploads/               # Загруженные файлы
│   ├── scripts/               # Скрипты для тестовых данных
│   ├── server.js              # Точка входа
│   └── package.json
│
├── src/                       # Vue 3 Frontend
│   ├── api/
│   │   └── axios.js           # Axios instance + интерцепторы
│   ├── components/
│   │   ├── Card.vue           # Карточка публикации
│   │   ├── Comment.vue        # Комментарий
│   │   ├── LikeButton.vue     # Кнопка лайка
│   │   ├── Contents.vue       # Контент ленты
│   │   ├── Stories.vue        # Лента историй
│   │   ├── StoryCarousel.vue  # Карусель историй
│   │   └── Sidebar.vue        # Боковая панель
│   ├── pages/
│   │   ├── Home.vue           # Главная / лента
│   │   ├── Create.vue         # Создание публикации
│   │   ├── Explore.vue        # Страница исследований
│   │   ├── Profile.vue        # Профиль пользователя
│   │   ├── EditProfile.vue    # Редактирование профиля
│   │   ├── Login.vue          # Вход
│   │   ├── Register.vue       # Регистрация
│   │   ├── Messages.vue       # Сообщения
│   │   ├── Notifications.vue  # Уведомления
│   │   ├── StoryViewer.vue    # Просмотр историй
│   │   └── StoryCarousel.vue  # Карусель историй (страница)
│   ├── router/                # Vue Router маршруты
│   ├── stores/                # Pinia stores
│   │   ├── auth.js            # Аутентификация
│   │   ├── posts.js           # Публикации
│   │   ├── comments.js        # Комментарии
│   │   ├── stories.js         # Истории
│   │   ├── notifications.js   # Уведомления
│   │   └── search.js          # Поиск
│   ├── assets/                # Статические ресурсы
│   ├── App.vue                # Корневой компонент
│   └── main.js                # Точка входа
│
├── public/                    # Публичные файлы
├── css/                       # Глобальные стили
├── js/                        # Глобальные скрипты
├── img/                       # Изображения
├── .env                       # Переменные frontend
├── vite.config.js             # Конфигурация Vite
├── package.json               # Зависимости frontend
└── README.md                  # Этот файл
```

---

## � Быстрый старт

### Требования

- **Node.js** 18+
- **MongoDB** (запущен на порту 27017)

### Установка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd instagram

# Установить зависимости frontend
npm install

# Установить зависимости backend
cd backend && npm install
cd ..
```

### Настройка окружения

**Frontend** (`.env` в корне):

```env
VITE_API_URL=http://localhost:5000/api
```

**Backend** (`backend/.env`):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/instagram
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:5173
```

### Запуск

```bash
# Frontend + Backend вместе
npm run dev

# Только frontend
npm run dev:frontend

# Только backend
npm run dev:backend
# или
npm run server
```

| Сервис      | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:5173 |
| Backend API | http://localhost:5000 |

### Сборка для продакшена

```bash
npm run build
npm run preview
```

---

## 📡 API Endpoints

### Аутентификация

| Метод | Endpoint             | Описание          |
| ----- | -------------------- | ----------------- |
| POST  | `/api/auth/register` | Регистрация       |
| POST  | `/api/auth/login`    | Вход              |
| POST  | `/api/auth/logout`   | Выход             |
| POST  | `/api/auth/refresh`  | Обновление токена |

### Пользователи

| Метод  | Endpoint                  | Описание             |
| ------ | ------------------------- | -------------------- |
| GET    | `/api/users/:username`    | Профиль пользователя |
| PUT    | `/api/users/profile`      | Обновление профиля   |
| PUT    | `/api/users/avatar`       | Загрузка аватара     |
| DELETE | `/api/users/avatar`       | Удаление аватара     |
| POST   | `/api/users/:id/follow`   | Подписка             |
| POST   | `/api/users/:id/unfollow` | Отписка              |
| GET    | `/api/users/search`       | Поиск пользователей  |

### Публикации

| Метод  | Endpoint                  | Описание                |
| ------ | ------------------------- | ----------------------- |
| GET    | `/api/posts/feed`         | Лента публикаций        |
| GET    | `/api/posts/:id`          | Одна публикация         |
| POST   | `/api/posts`              | Создать публикацию      |
| DELETE | `/api/posts/:id`          | Удалить публикацию      |
| POST   | `/api/posts/:id/like`     | Лайк                    |
| POST   | `/api/posts/:id/unlike`   | Убрать лайк             |
| GET    | `/api/posts/user/:userId` | Публикации пользователя |

### Истории

| Метод  | Endpoint                 | Описание             |
| ------ | ------------------------ | -------------------- |
| GET    | `/api/stories/`          | Все истории          |
| GET    | `/api/stories/:username` | Истории пользователя |
| POST   | `/api/stories`           | Создать историю      |
| DELETE | `/api/stories/:id`       | Удалить историю      |
| POST   | `/api/stories/:id/view`  | Отметить просмотр    |

### Комментарии

| Метод  | Endpoint                   | Описание                 |
| ------ | -------------------------- | ------------------------ |
| GET    | `/api/comments/:postId`    | Комментарии к публикации |
| POST   | `/api/comments`            | Добавить комментарий     |
| DELETE | `/api/comments/:id`        | Удалить комментарий      |
| POST   | `/api/comments/:id/like`   | Лайк комментария         |
| POST   | `/api/comments/:id/unlike` | Убрать лайк              |

### Уведомления

| Метод  | Endpoint                      | Описание             |
| ------ | ----------------------------- | -------------------- |
| GET    | `/api/notifications`          | Список уведоманий    |
| PATCH  | `/api/notifications/:id/read` | Отметить прочитанным |
| PATCH  | `/api/notifications/read-all` | Прочитать все        |
| DELETE | `/api/notifications/:id`      | Удалить              |

---

## 🧪 Тестирование

1. Запустите проект: `npm run dev`
2. Откройте http://localhost:5173/register
3. Зарегистрируйтесь:
   - **Username**: `testuser`
   - **Email**: `test@test.com`
   - **Password**: `password123`
4. Создайте публикацию через кнопку «+»

---

## 🔧 Решение проблем

### MongoDB не запущен

```bash
# Проверить
netstat -ano | findstr :27017

# Скачать: https://www.mongodb.com/try/download/community
```

### Порт 5000 занят

Измените `PORT=5001` в `backend/.env` и `VITE_API_URL` в `.env`.

### Ошибка CORS

Убедитесь, что `FRONTEND_URL=http://localhost:5173` в `backend/.env`.

### Backend не запускается

```bash
cd backend
copy .env.example .env   # Windows
cp .env.example .env     # Linux/Mac
```

---

## 📝 Лицензия

MIT
