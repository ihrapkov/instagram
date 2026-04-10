# Тестирование проекта Instagram

Этот проект использует два фреймворка для тестирования:
- **Vitest** - для тестирования фронтенда (Vue 3)
- **Jest** - для тестирования бэкенда (Express)

## Структура тестов

### Фронтенд (Vitest)
```
src/
├── stores/__tests__/         # Тесты для Pinia stores
│   ├── auth.test.js         # Тесты аутентификации
│   └── posts.test.js        # Тесты постов
├── components/__tests__/     # Тесты Vue компонентов
│   ├── LikeButton.test.js   # Тесты кнопки лайка
│   └── Comment.test.js      # Тесты компонента комментариев
└── test/
    └── setup.js             # Глобальная настройка тестов
```

### Бэкенд (Jest)
```
backend/
├── __tests__/
│   ├── auth.test.js         # Тесты API аутентификации
│   └── setup.js             # Настройка тестового окружения
└── jest.config.js           # Конфигурация Jest
```

## Запуск тестов

### Фронтенд (Vitest)

```bash
# Запуск всех тестов
npm test

# Запуск в режиме watch (автоматический перезапуск при изменениях)
npm run test:ui

# Однократный запуск всех тестов
npm run test:run

# Запуск с отчётом о покрытии кода
npm run test:coverage
```

### Бэкенд (Jest)

```bash
cd backend

# Запуск всех тестов
npm test

# Запуск в режиме watch
npm run test:watch

# Запуск с отчётом о покрытии кода
npm run test:coverage
```

## Что тестируется

### Фронтенд

#### Stores (Pinia)
- **Auth Store**
  - Регистрация пользователя
  - Вход и выход
  - Обновление токена
  - Подписка/отписка
  - Работа с localStorage

- **Posts Store**
  - Загрузка ленты
  - Создание/удаление постов
  - Лайки/анлайки
  - Пагинация

#### Компоненты
- **LikeButton**
  - Отображение состояния лайка
  - Склонение слова "отметка"
  - Обработка кликов
  - Состояние загрузки

- **Comment**
  - Отображение комментариев
  - Добавление комментариев
  - Удаление комментариев
  - Проверка прав доступа
  - Форматирование времени

### Бэкенд

#### Auth API
- Регистрация пользователя
- Вход по email/username
- Обновление токена
- Валидация данных
- Обработка ошибок

## Моки и стабы

### Фронтенд
- API вызовы мокаются через `vi.mock()`
- localStorage мокается глобально в `setup.js`
- Stores мокаются в тестах компонентов

### Бэкенд
- Используется `mongodb-memory-server` для изолированной тестовой базы
- Каждый тест запускается с чистой базой данных
- Тестовые переменные окружения устанавливаются в `setup.js`

## Написание новых тестов

### Фронтенд (Vitest)

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

describe('My Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should do something', () => {
    // Arrange
    const wrapper = mount(MyComponent, {
      global: {
        plugins: [createPinia()]
      }
    })
    
    // Act
    await wrapper.find('button').trigger('click')
    
    // Assert
    expect(wrapper.emitted('my-event')).toBeTruthy()
  })
})
```

### Бэкенд (Jest)

```javascript
import request from 'supertest'
import app from '../server.js'

describe('My API', () => {
  it('should return 200', async () => {
    const res = await request(app)
      .post('/api/my-endpoint')
      .send({ data: 'test' })

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('success')
  })
})
```

## Continuous Integration

Тесты можно запускать автоматически при push/PR через GitHub Actions или другие CI/CD системы.

## Покрытие кода

Для просмотра покрытия кода тестами:

```bash
# Фронтенд
npm run test:coverage

# Бэкенд
cd backend
npm run test:coverage
```

Отчёты будут доступны в папках:
- Фронтенд: `coverage/`
- Бэкенд: `backend/coverage/`
