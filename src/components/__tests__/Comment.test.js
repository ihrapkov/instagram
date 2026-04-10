import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Comment from "@/components/Comment.vue";
import { useAuthStore } from "@/stores/auth";
import { useCommentsStore } from "@/stores/comments";

// Мокаем stores
vi.mock("@/stores/auth", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/stores/comments", () => ({
  useCommentsStore: vi.fn(),
}));

describe("Comment Component", () => {
  const mockAuthStore = {
    currentUser: { _id: "user1", username: "testuser" },
  };

  const mockCommentsStore = {
    fetchComments: vi.fn(),
    addComment: vi.fn(),
    deleteComment: vi.fn(),
    getCommentsByPost: vi.fn().mockReturnValue([]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.mockReturnValue(mockAuthStore);
    useCommentsStore.mockReturnValue(mockCommentsStore);
    global.confirm = vi.fn(() => true);
    global.alert = vi.fn();
  });

  const factory = (props = {}, options = {}) => {
    return mount(Comment, {
      props: {
        postId: "test-post-id",
        comments: [],
        ...props,
      },
      global: {
        plugins: [createPinia()],
        stubs: ["router-link", "router-view"],
        ...options,
      },
    });
  };

  it("рендерится корректно", () => {
    const wrapper = factory();

    expect(wrapper.find(".comments-container").exists()).toBe(true);
    expect(wrapper.find(".comment-input").exists()).toBe(true);
    expect(wrapper.find(".comment-submit").exists()).toBe(true);
  });

  it("отображает переданные комментарии", async () => {
    const mockComments = [
      {
        _id: "1",
        text: "Test comment",
        user: { _id: "user2", username: "user2", avatar: "" },
        createdAt: new Date().toISOString(),
      },
    ];

    const wrapper = factory({ comments: mockComments });
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".comment-item").exists()).toBe(true);
  });

  it("отображает сообщение когда нет комментариев", () => {
    const wrapper = factory({ comments: [] });

    expect(wrapper.find(".no-comments").text()).toBe(
      "Нет комментариев. Будьте первым!",
    );
  });

  it("добавляет комментарий при отправке формы", async () => {
    mockCommentsStore.addComment.mockResolvedValue({
      success: true,
      comment: { _id: "new", text: "New comment" },
    });

    const wrapper = factory();
    const input = wrapper.find(".comment-input");

    await input.setValue("New comment");
    await wrapper.find("form").trigger("submit.prevent");

    expect(mockCommentsStore.addComment).toHaveBeenCalledWith(
      "test-post-id",
      "New comment",
    );
    expect(wrapper.emitted("comment-added")).toBeTruthy();
  });

  it("не добавляет пустой комментарий", async () => {
    const wrapper = factory();

    await wrapper.find(".comment-input").setValue("   ");
    await wrapper.find("form").trigger("submit.prevent");

    expect(mockCommentsStore.addComment).not.toHaveBeenCalled();
  });

  it("удаляет комментарий с подтверждением", async () => {
    mockCommentsStore.deleteComment.mockResolvedValue({ success: true });

    const mockComments = [
      {
        _id: "1",
        text: "My comment",
        user: { _id: "user1", username: "testuser", avatar: "" },
        createdAt: new Date().toISOString(),
      },
    ];

    const wrapper = factory({ comments: mockComments });
    await wrapper.find(".comment-delete").trigger("click");

    expect(global.confirm).toHaveBeenCalledWith("Удалить комментарий?");
    expect(mockCommentsStore.deleteComment).toHaveBeenCalledWith(
      "test-post-id",
      "1",
    );
    expect(wrapper.emitted("comment-deleted")).toBeTruthy();
  });

  it("показывает кнопку удаления только для своих комментариев", () => {
    const mockComments = [
      {
        _id: "1",
        text: "My comment",
        user: { _id: "user1", username: "testuser", avatar: "" },
        createdAt: new Date().toISOString(),
      },
      {
        _id: "2",
        text: "Other comment",
        user: { _id: "user2", username: "otheruser", avatar: "" },
        createdAt: new Date().toISOString(),
      },
    ];

    const wrapper = factory({ comments: mockComments });
    const deleteButtons = wrapper.findAll(".comment-delete");

    // Только один комментарий принадлежит текущему пользователю
    expect(deleteButtons).toHaveLength(1);
  });

  it("правильно форматирует время", () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(
      now.getTime() - 5 * 60 * 1000,
    ).toISOString();

    const mockComments = [
      {
        _id: "1",
        text: "Comment",
        user: { _id: "user2", username: "user2", avatar: "" },
        createdAt: fiveMinutesAgo,
      },
    ];

    const wrapper = factory({ comments: mockComments });

    expect(wrapper.find(".comment-time").text()).toContain("мин.");
  });

  it("корректно обрабатывает URL аватара", async () => {
    const mockComments = [
      {
        _id: "1",
        text: "Comment",
        user: {
          _id: "user2",
          username: "user2",
          avatar: "http://example.com/avatar.jpg",
        },
        createdAt: new Date().toISOString(),
      },
    ];

    const wrapper = factory({ comments: mockComments });
    await wrapper.vm.$nextTick();

    // Проверяем что комментарий отрендерился
    expect(wrapper.find(".comment-item").exists()).toBe(true);
  });

  it("отключает ввод когда пользователь не авторизован", () => {
    useAuthStore.mockReturnValue({ currentUser: null });

    const wrapper = factory();

    expect(wrapper.find(".comment-input").attributes("disabled")).toBeDefined();
    expect(
      wrapper.find(".comment-submit").attributes("disabled"),
    ).toBeDefined();
  });

  it("загружает комментарии при монтировании если они не переданы", () => {
    factory({ comments: [] });

    expect(mockCommentsStore.fetchComments).toHaveBeenCalledWith(
      "test-post-id",
    );
  });

  it("не загружает комментарии при монтировании если они переданы", () => {
    const mockComments = [
      {
        _id: "1",
        text: "Comment",
        user: { _id: "user2", username: "user2", avatar: "" },
        createdAt: new Date().toISOString(),
      },
    ];

    factory({ comments: mockComments });

    expect(mockCommentsStore.fetchComments).not.toHaveBeenCalled();
  });
});
