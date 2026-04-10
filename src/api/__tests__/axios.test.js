import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import {
  authAPI,
  userAPI,
  postAPI,
  storyAPI,
  commentAPI,
  notificationAPI,
} from "@/api/axios";

// Мокаем axios
vi.mock("axios", () => {
  const mockAxios = {
    create: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
        eject: vi.fn(),
      },
      response: {
        use: vi.fn(),
        eject: vi.fn(),
      },
    },
  };

  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn((callback) => {
          callback({ headers: {} });
        }),
      },
      response: {
        use: vi.fn(),
      },
    },
  };

  mockAxios.create.mockReturnValue(mockInstance);

  return {
    default: mockAxios,
  };
});

describe("API Module", () => {
  let api;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);

    // Пересоздаём экземпляр axios для каждого теста
    const axiosModule = vi.mocked(axios);
    api = axiosModule.create();
  });

  describe("authAPI", () => {
    it("register вызывает POST /auth/register", () => {
      const mockData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      api.post.mockResolvedValue({ data: { success: true } });

      authAPI.register(mockData);

      expect(api.post).toHaveBeenCalledWith("/auth/register", mockData);
    });

    it("login вызывает POST /auth/login", () => {
      const mockData = {
        email: "test@example.com",
        password: "password123",
      };

      api.post.mockResolvedValue({ data: { success: true } });

      authAPI.login(mockData);

      expect(api.post).toHaveBeenCalledWith("/auth/login", mockData);
    });

    it("logout вызывает POST /auth/logout", () => {
      api.post.mockResolvedValue({ data: { success: true } });

      authAPI.logout();

      expect(api.post).toHaveBeenCalledWith("/auth/logout");
    });

    it("refresh вызывает POST /auth/refresh", () => {
      const refreshToken = "test-refresh-token";

      api.post.mockResolvedValue({ data: { success: true } });

      authAPI.refresh(refreshToken);

      expect(api.post).toHaveBeenCalledWith("/auth/refresh", { refreshToken });
    });
  });

  describe("userAPI", () => {
    it("getProfile вызывает GET /users/:username", () => {
      api.get.mockResolvedValue({ data: { user: {} } });

      userAPI.getProfile("testuser");

      expect(api.get).toHaveBeenCalledWith("/users/testuser");
    });

    it("updateProfile вызывает PUT /users/profile", () => {
      const profileData = {
        fullName: "Test User",
        bio: "Test bio",
      };

      api.put.mockResolvedValue({ data: { success: true } });

      userAPI.updateProfile(profileData);

      expect(api.put).toHaveBeenCalledWith("/users/profile", profileData);
    });

    it("follow вызывает POST /users/:id/follow", () => {
      api.post.mockResolvedValue({ data: { success: true } });

      userAPI.follow("user123");

      expect(api.post).toHaveBeenCalledWith("/users/user123/follow");
    });

    it("unfollow вызывает POST /users/:id/unfollow", () => {
      api.post.mockResolvedValue({ data: { success: true } });

      userAPI.unfollow("user123");

      expect(api.post).toHaveBeenCalledWith("/users/user123/unfollow");
    });

    it("search вызывает GET /users/search с параметрами", () => {
      api.get.mockResolvedValue({ data: { users: [] } });

      userAPI.search("test");

      expect(api.get).toHaveBeenCalledWith("/users/search", {
        params: { q: "test" },
      });
    });
  });

  describe("postAPI", () => {
    it("getFeed вызывает GET /posts/feed с параметрами", () => {
      api.get.mockResolvedValue({ data: { posts: [] } });

      postAPI.getFeed(2, 20);

      expect(api.get).toHaveBeenCalledWith("/posts/feed", {
        params: { page: 2, limit: 20 },
      });
    });

    it("getPost вызывает GET /posts/:id", () => {
      api.get.mockResolvedValue({ data: { post: {} } });

      postAPI.getPost("post123");

      expect(api.get).toHaveBeenCalledWith("/posts/post123");
    });

    it("createPost вызывает POST /posts с FormData", () => {
      const formData = new FormData();

      api.post.mockResolvedValue({ data: { post: {} } });

      postAPI.createPost(formData);

      expect(api.post).toHaveBeenCalledWith("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    });

    it("deletePost вызывает DELETE /posts/:id", () => {
      api.delete.mockResolvedValue({ data: { success: true } });

      postAPI.deletePost("post123");

      expect(api.delete).toHaveBeenCalledWith("/posts/post123");
    });

    it("like вызывает POST /posts/:id/like", () => {
      api.post.mockResolvedValue({ data: { success: true } });

      postAPI.like("post123");

      expect(api.post).toHaveBeenCalledWith("/posts/post123/like");
    });

    it("unlike вызывает POST /posts/:id/unlike", () => {
      api.post.mockResolvedValue({ data: { success: true } });

      postAPI.unlike("post123");

      expect(api.post).toHaveBeenCalledWith("/posts/post123/unlike");
    });

    it("getUserPosts вызывает GET /posts/user/:userId", () => {
      api.get.mockResolvedValue({ data: { posts: [] } });

      postAPI.getUserPosts("user123", 2, 15);

      expect(api.get).toHaveBeenCalledWith("/posts/user/user123", {
        params: { page: 2, limit: 15 },
      });
    });
  });

  describe("storyAPI", () => {
    it("getAll вызывает GET /stories/", () => {
      api.get.mockResolvedValue({ data: { stories: [] } });

      storyAPI.getAll();

      expect(api.get).toHaveBeenCalledWith("/stories/");
    });

    it("getByUsername вызывает GET /stories/:username", () => {
      api.get.mockResolvedValue({ data: { stories: [] } });

      storyAPI.getByUsername("testuser");

      expect(api.get).toHaveBeenCalledWith("/stories/testuser");
    });

    it("create вызывает POST /stories с FormData", () => {
      const formData = new FormData();

      api.post.mockResolvedValue({ data: { story: {} } });

      storyAPI.create(formData);

      expect(api.post).toHaveBeenCalledWith("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    });

    it("delete вызывает DELETE /stories/:id", () => {
      api.delete.mockResolvedValue({ data: { success: true } });

      storyAPI.delete("story123");

      expect(api.delete).toHaveBeenCalledWith("/stories/story123");
    });

    it("view вызывает POST /stories/:id/view", () => {
      api.post.mockResolvedValue({ data: { success: true } });

      storyAPI.view("story123");

      expect(api.post).toHaveBeenCalledWith("/stories/story123/view");
    });
  });

  describe("commentAPI", () => {
    it("getComments вызывает GET /comments/:postId", () => {
      api.get.mockResolvedValue({ data: { comments: [] } });

      commentAPI.getComments("post123");

      expect(api.get).toHaveBeenCalledWith("/comments/post123");
    });

    it("addComment вызывает POST /comments", () => {
      api.post.mockResolvedValue({ data: { comment: {} } });

      commentAPI.addComment("post123", "Test comment");

      expect(api.post).toHaveBeenCalledWith("/comments", {
        postId: "post123",
        text: "Test comment",
      });
    });

    it("deleteComment вызывает DELETE /comments/:id", () => {
      api.delete.mockResolvedValue({ data: { success: true } });

      commentAPI.deleteComment("comment123");

      expect(api.delete).toHaveBeenCalledWith("/comments/comment123");
    });

    it("likeComment вызывает POST /comments/:id/like", () => {
      api.post.mockResolvedValue({ data: { success: true } });

      commentAPI.likeComment("comment123");

      expect(api.post).toHaveBeenCalledWith("/comments/comment123/like");
    });

    it("unlikeComment вызывает POST /comments/:id/unlike", () => {
      api.post.mockResolvedValue({ data: { success: true } });

      commentAPI.unlikeComment("comment123");

      expect(api.post).toHaveBeenCalledWith("/comments/comment123/unlike");
    });
  });

  describe("notificationAPI", () => {
    it("getAll вызывает GET /notifications с параметрами", () => {
      api.get.mockResolvedValue({ data: { notifications: [] } });

      notificationAPI.getAll(2, 30);

      expect(api.get).toHaveBeenCalledWith("/notifications", {
        params: { page: 2, limit: 30 },
      });
    });

    it("markAsRead вызывает PATCH /notifications/:id/read", () => {
      api.patch.mockResolvedValue({ data: { success: true } });

      notificationAPI.markAsRead("notif123");

      expect(api.patch).toHaveBeenCalledWith("/notifications/notif123/read");
    });

    it("markAllAsRead вызывает PATCH /notifications/read-all", () => {
      api.patch.mockResolvedValue({ data: { success: true } });

      notificationAPI.markAllAsRead();

      expect(api.patch).toHaveBeenCalledWith("/notifications/read-all");
    });

    it("delete вызывает DELETE /notifications/:id", () => {
      api.delete.mockResolvedValue({ data: { success: true } });

      notificationAPI.delete("notif123");

      expect(api.delete).toHaveBeenCalledWith("/notifications/notif123");
    });
  });
});
