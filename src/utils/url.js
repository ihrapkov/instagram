const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Возвращает базовый URL API (без /api на конце)
 * Пример: http://localhost:5000
 */
export function getBaseUrl() {
  return API_URL.replace(/\/api$/, '')
}

/**
 * Формирует полный URL для ресурса (аватар, посты, истории)
 * Если path уже абсолютный (начинается с http), возвращает как есть
 * Если path начинается с /, добавляет базовый URL
 * Если path falsy — возвращает fallback
 */
export function assetUrl(path, fallback = '/img/foto.jpg') {
  if (!path) return fallback
  if (path.startsWith('http')) return path
  return `${getBaseUrl()}${path}`
}
