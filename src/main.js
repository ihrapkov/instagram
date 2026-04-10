import "./assets/styles/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

import App from "./App.vue";
import router, { setAuthReady } from "./router";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus);

// Проверка аутентификации при загрузке
const authStore = useAuthStore(pinia);
authStore.checkAuth().then(() => {
  setAuthReady();
});

app.mount("#app");
