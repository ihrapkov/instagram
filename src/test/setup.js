import { config } from '@vue/test-utils'

// Глобальная настройка stubs для компонентов
config.global.stubs = {
  RouterLink: true,
  RouterView: true
}

// Мокаем localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Мокаем window.location
delete window.location
window.location = {
  href: ''
}
