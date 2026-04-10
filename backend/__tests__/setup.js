// Setup для тестов бэкенда
import dotenv from 'dotenv'

// Загружаем тестовые переменные окружения
dotenv.config({ path: '.env.test' })

// Устанавливаем тестовые переменные
process.env.JWT_SECRET = 'test-secret-key'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
process.env.NODE_ENV = 'test'

// Глобальный таймаут для тестов
jest.setTimeout(30000)

// Очистка после каждого теста
afterEach(async () => {
  // Здесь можно добавить очистку базы данных
})
