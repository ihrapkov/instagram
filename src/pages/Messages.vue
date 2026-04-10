<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="messages-page">
    <div class="messages-placeholder">
      <i class="fa-regular fa-paper-plane"></i>
      <h2>Сообщения</h2>
      <p>Этот раздел находится в разработке</p>
      <button class="back-btn" @click="router.push('/')">
        Вернуться на главную
      </button>
    </div>
  </div>
</template>

<style scoped>
.messages-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 60px 20px;
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.messages-placeholder {
  text-align: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.messages-placeholder i {
  font-size: 80px;
  color: #dbdbdb;
  margin-bottom: 20px;
}

.messages-placeholder h2 {
  font-size: 28px;
  font-weight: 300;
  margin: 0 0 10px;
  color: #262626;
}

.messages-placeholder p {
  font-size: 16px;
  color: #8e8e8e;
  margin: 0 0 30px;
}

.back-btn {
  padding: 10px 24px;
  background: #0095f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #0081d6;
}
</style>
