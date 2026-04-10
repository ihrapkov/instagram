import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import LikeButton from "@/components/LikeButton.vue";
import { usePostsStore } from "@/stores/posts";

// Мокаем store
vi.mock("@/stores/posts", () => ({
  usePostsStore: vi.fn(),
}));

describe("LikeButton Component", () => {
  const mockPostsStore = {
    likePost: vi.fn(),
    unlikePost: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    usePostsStore.mockReturnValue(mockPostsStore);
  });

  const factory = (props = {}) => {
    return mount(LikeButton, {
      props: {
        postId: "test-post-id",
        isLiked: false,
        likesCount: 0,
        ...props,
      },
      global: {
        plugins: [createPinia()],
      },
    });
  };

  it("рендерится корректно с начальными пропсами", () => {
    const wrapper = factory({ isLiked: false, likesCount: 5 });

    expect(wrapper.find("button").classes()).not.toContain("liked");
    expect(wrapper.find(".like-count").text()).toBe("5");
  });

  it("отображает залитое сердце когда пост лайкнут", () => {
    const wrapper = factory({ isLiked: true, likesCount: 10 });

    const icon = wrapper.find("button i");
    expect(icon.classes()).toContain("fa-solid");
    expect(icon.classes()).toContain("fa-heart");
    expect(wrapper.find("button").classes()).toContain("liked");
  });

  it("отображает пустое сердце когда пост не лайкнут", () => {
    const wrapper = factory({ isLiked: false, likesCount: 0 });

    const icon = wrapper.find("button i");
    expect(icon.classes()).toContain("fa-regular");
    expect(icon.classes()).toContain("fa-heart");
    expect(wrapper.find("button").classes()).not.toContain("liked");
  });

  it('склоняет слово "отметка" правильно для 1', () => {
    const wrapper = factory({ likesCount: 1 });

    expect(wrapper.find(".like-card-text").text()).toContain(
      'отметка "Нравится"',
    );
  });

  it('склоняет слово "отметка" правильно для 2-4', () => {
    const wrapper = factory({ likesCount: 3 });

    expect(wrapper.find(".like-card-text").text()).toContain(
      'отметки "Нравится"',
    );
  });

  it('склоняет слово "отметка" правильно для 5+', () => {
    const wrapper = factory({ likesCount: 10 });

    expect(wrapper.find(".like-card-text").text()).toContain(
      'отметок "Нравится"',
    );
  });

  it("вызывает likePost при клике если не лайкнут", async () => {
    mockPostsStore.likePost.mockResolvedValue({ success: true, likes: 6 });

    const wrapper = factory({ isLiked: false, likesCount: 5 });
    await wrapper.find("button").trigger("click");

    expect(mockPostsStore.likePost).toHaveBeenCalledWith("test-post-id");
    expect(wrapper.emitted("like-change")).toBeTruthy();
    expect(wrapper.emitted("like-change")[0]).toEqual([
      { isLiked: true, count: 6 },
    ]);
  });

  it("вызывает unlikePost при клике если лайкнут", async () => {
    mockPostsStore.unlikePost.mockResolvedValue({ success: true, likes: 4 });

    const wrapper = factory({ isLiked: true, likesCount: 5 });
    await wrapper.find("button").trigger("click");

    expect(mockPostsStore.unlikePost).toHaveBeenCalledWith("test-post-id");
    expect(wrapper.emitted("like-change")).toBeTruthy();
    expect(wrapper.emitted("like-change")[0]).toEqual([
      { isLiked: false, count: 4 },
    ]);
  });

  it("блокирует кнопку во время загрузки", async () => {
    let resolvePromise;
    mockPostsStore.likePost.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = () => resolve({ success: true, likes: 6 });
        }),
    );

    const wrapper = factory({ isLiked: false });

    // Запускаем клик но не ждём завершения
    const clickPromise = wrapper.find("button").trigger("click");

    // Даём Vue обновиться
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    // Проверяем что кнопка заблокирована (loading = true)
    expect(wrapper.vm.loading).toBe(true);

    // Разрешаем промис
    resolvePromise();
    await clickPromise;
  });

  it("не делает запрос если уже загружается", async () => {
    mockPostsStore.likePost.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100),
        ),
    );

    const wrapper = factory({ isLiked: false });

    // Два быстрых клика
    wrapper.find("button").trigger("click");
    wrapper.find("button").trigger("click");

    // Должен быть только один вызов
    expect(mockPostsStore.likePost).toHaveBeenCalledTimes(1);
  });
});
