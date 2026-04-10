import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import Profile from "../pages/Profile.vue";
import EditProfile from "../pages/EditProfile.vue";
import Explore from "../pages/Explore.vue";
import Messages from "../pages/Messages.vue";
import Create from "../pages/Create.vue";
import Notifications from "../pages/Notifications.vue";
import StoryViewer from "../pages/StoryViewer.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/register",
      name: "register",
      component: Register,
    },
    {
      path: "/",
      name: "home",
      component: Home,
      meta: { requiresAuth: true },
    },
    {
      path: "/explore",
      name: "explore",
      component: Explore,
      meta: { requiresAuth: true },
    },
    {
      path: "/profile/edit",
      name: "edit-profile",
      component: EditProfile,
      meta: { requiresAuth: true },
    },
    {
      path: "/profile/:username?",
      name: "profile",
      component: Profile,
      meta: { requiresAuth: true },
    },
    {
      path: "/messages/:username?",
      name: "messages",
      component: Messages,
      meta: { requiresAuth: true },
    },
    {
      path: "/create",
      name: "create",
      component: Create,
      meta: { requiresAuth: true },
    },
    {
      path: "/notifications",
      name: "notifications",
      component: Notifications,
      meta: { requiresAuth: true },
    },
    {
      path: "/stories/:username",
      name: "story-viewer",
      component: StoryViewer,
    },
  ],
});

// Глобальная защита маршрутов
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated");

  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/login");
  } else {
    next();
  }
});

export default router;
