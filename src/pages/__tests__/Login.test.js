import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/pages/Login.vue'

// Мокаем auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn()
}))

import { useAuthStore } from '@/stores/auth'

describe('Login Page', () => {
  const mockAuthStore = {
    login: vi.fn()
  }

  let router

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    
    useAuthStore.mockReturnValue(mockAuthStore)

    // Создаём простой роутер для тестов
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/login', component: Login },
        { path: '/register', component: { template: '<div>Register</div>' } },
        { path: '/', component: { template: '<div>Home</div>' } }
      ]
    })

    router.push('/login')
  })

  const factory = async () => {
    await router.isReady()
    
    const wrapper = mount(Login, {
      global: {
        plugins: [router, createPinia()]
      }
    })

    return wrapper
  }

  it('рендерится корректно', async () => {
    const wrapper = await factory()
    
    expect(wrapper.find('.auth-container').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.findAll('input')).toHaveLength(2)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Войти')
  })

  it('показывает ошибку при пустых полях', async () => {
    const wrapper = await factory()
    
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.find('.error-message').text()).toBe('Заполните все поля')
  })

  it('вызывает login при отправке формы', async () => {
    mockAuthStore.login.mockResolvedValue({ success: true })
    
    const wrapper = await factory()
    
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('test@example.com')
    await inputs[1].setValue('password123')
    
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockAuthStore.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('показывает ошибку при неудачном входе', async () => {
    mockAuthStore.login.mockResolvedValue({
      success: false,
      message: 'Неверный email или пароль'
    })
    
    const wrapper = await factory()
    
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('wrong@example.com')
    await inputs[1].setValue('wrongpassword')
    
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.error-message').text()).toBe('Неверный email или пароль')
  })

  it('перенаправляет на главную при успешном входе', async () => {
    mockAuthStore.login.mockResolvedValue({ success: true })
    
    const wrapper = await factory()
    
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('test@example.com')
    await inputs[1].setValue('password123')
    
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('показывает состояние загрузки', async () => {
    let resolveLogin
    mockAuthStore.login.mockImplementation(
      () => new Promise(resolve => {
        resolveLogin = () => resolve({ success: true })
      })
    )
    
    const wrapper = await factory()
    
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('test@example.com')
    await inputs[1].setValue('password123')
    
    wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('button').text()).toBe('Вход...')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    
    resolveLogin()
    await flushPromises()
  })

  it('имеет ссылку на регистрацию', async () => {
    const wrapper = await factory()
    
    const registerLink = wrapper.find('.register-link router-link-stub')
    expect(registerLink.exists()).toBe(true)
    expect(registerLink.attributes('to')).toBe('/register')
  })
})
