import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Register from '@/pages/Register.vue'

// Мокаем auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn()
}))

import { useAuthStore } from '@/stores/auth'

describe('Register Page', () => {
  const mockAuthStore = {
    register: vi.fn()
  }

  let router

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    
    useAuthStore.mockReturnValue(mockAuthStore)

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/register', component: Register },
        { path: '/login', component: { template: '<div>Login</div>' } },
        { path: '/', component: { template: '<div>Home</div>' } }
      ]
    })

    router.push('/register')
  })

  const factory = async () => {
    await router.isReady()
    
    const wrapper = mount(Register, {
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
    expect(wrapper.findAll('input')).toHaveLength(4)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Зарегистрироваться')
  })

  it('показывает ошибку при пустых обязательных полях', async () => {
    const wrapper = await factory()
    
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.find('.error-message').text()).toBe('Заполните обязательные поля')
  })

  it('показывает ошибку при коротком пароле', async () => {
    const wrapper = await factory()
    
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('testuser')
    await inputs[1].setValue('test@example.com')
    await inputs[2].setValue('123')
    
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.find('.error-message').text()).toBe('Пароль должен быть не менее 6 символов')
  })

  it('вызывает register при отправке формы', async () => {
    mockAuthStore.register.mockResolvedValue({ success: true })
    
    const wrapper = await factory()
    
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('testuser')
    await inputs[1].setValue('test@example.com')
    await inputs[2].setValue('password123')
    await inputs[3].setValue('Test User')
    
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockAuthStore.register).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User'
    })
  })

  it('показывает ошибку при неудачной регистрации', async () => {
    mockAuthStore.register.mockResolvedValue({
      success: false,
      message: 'Пользователь уже существует'
    })
    
    const wrapper = await factory()
    
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('existinguser')
    await inputs[1].setValue('existing@example.com')
    await inputs[2].setValue('password123')
    
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('.error-message').text()).toBe('Пользователь уже существует')
  })

  it('перенаправляет на главную при успешной регистрации', async () => {
    mockAuthStore.register.mockResolvedValue({ success: true })
    
    const wrapper = await factory()
    
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('newuser')
    await inputs[1].setValue('new@example.com')
    await inputs[2].setValue('password123')
    
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('показывает состояние загрузки', async () => {
    let resolveRegister
    mockAuthStore.register.mockImplementation(
      () => new Promise(resolve => {
        resolveRegister = () => resolve({ success: true })
      })
    )
    
    const wrapper = await factory()
    
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('testuser')
    await inputs[1].setValue('test@example.com')
    await inputs[2].setValue('password123')
    
    wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('button').text()).toBe('Регистрация...')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    
    resolveRegister()
    await flushPromises()
  })

  it('имеет ссылку на вход', async () => {
    const wrapper = await factory()
    
    const loginLink = wrapper.find('.login-link router-link-stub')
    expect(loginLink.exists()).toBe(true)
    expect(loginLink.attributes('to')).toBe('/login')
  })
})
