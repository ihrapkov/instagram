<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Список чатов
const chats = ref([
  { id: 1, username: 'user_1', avatar: '/img/foto.jpg', lastMessage: 'Привет!', time: '2ч', unread: true },
  { id: 2, username: 'user_2', avatar: '/img/foto2.jpg', lastMessage: 'Как дела?', time: '5ч', unread: false },
  { id: 3, username: 'user_3', avatar: '/img/foto3.jpg', lastMessage: 'Отправил фото', time: '1д', unread: false },
  { id: 4, username: 'user_4', avatar: '/img/foto.jpg', lastMessage: 'Ок, договорились', time: '2д', unread: false }
])

// Текущий выбранный чат
const selectedChat = ref(null)

// Сообщения текущего чата
const messages = ref([
  { id: 1, text: 'Привет!', from: 'them', time: '10:00' },
  { id: 2, text: 'Привет! Как дела?', from: 'me', time: '10:05' },
  { id: 3, text: 'Всё отлично, спасибо!', from: 'them', time: '10:10' },
  { id: 4, text: 'Что нового?', from: 'me', time: '10:15' }
])

// Новое сообщение
const newMessage = ref('')

// Отправка сообщения
function sendMessage() {
  if (newMessage.value.trim()) {
    messages.value.push({
      id: messages.value.length + 1,
      text: newMessage.value,
      from: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
    newMessage.value = ''
  }
}

// Выбор чата
function selectChat(chat) {
  selectedChat.value = chat
}
</script>

<template>
  <div class="messages-page">
    <div class="messages-container">
      <!-- Список чатов -->
      <div class="chats-sidebar">
        <div class="chats-header">
          <h2>{{ route.params.username || 'Сообщения' }}</h2>
          <i class="fa-solid fa-pen-to-square new-chat-icon"></i>
        </div>
        <div class="chats-list">
          <div
            v-for="chat in chats"
            :key="chat.id"
            :class="['chat-item', { active: selectedChat?.id === chat.id }]"
            @click="selectChat(chat)"
          >
            <div class="chat-avatar">
              <img :src="chat.avatar" :alt="chat.username" />
              <span v-if="chat.unread" class="unread-badge"></span>
            </div>
            <div class="chat-info">
              <span class="chat-username">{{ chat.username }}</span>
              <span class="chat-last-message">{{ chat.lastMessage }}</span>
            </div>
            <span class="chat-time">{{ chat.time }}</span>
          </div>
        </div>
      </div>

      <!-- Окно чата -->
      <div class="chat-window">
        <div v-if="selectedChat" class="chat-active">
          <div class="chat-messages">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="['message', message.from]"
            >
              <div class="message-bubble">
                <p>{{ message.text }}</p>
                <span class="message-time">{{ message.time }}</span>
              </div>
            </div>
          </div>
          <div class="chat-input-container">
            <input
              v-model="newMessage"
              @keyup.enter="sendMessage"
              type="text"
              placeholder="Введите сообщение..."
              class="chat-input"
            />
            <button @click="sendMessage" class="send-btn">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
        <div v-else class="chat-empty">
          <div class="empty-icon">
            <i class="fa-solid fa-paper-plane"></i>
          </div>
          <h3>Ваши сообщения</h3>
          <p>Отправьте сообщение или создайте новый чат</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.messages-page {
  height: calc(100vh - 60px);
  display: flex;
  justify-content: center;
  padding: 20px;
}

.messages-container {
  display: flex;
  width: 100%;
  max-width: 935px;
  height: 100%;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  overflow: hidden;
}

.chats-sidebar {
  width: 350px;
  border-right: 1px solid #dbdbdb;
  display: flex;
  flex-direction: column;
}

.chats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #dbdbdb;
}

.chats-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.new-chat-icon {
  font-size: 20px;
  cursor: pointer;
}

.chats-list {
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.chat-item:hover {
  background: #fafafa;
}

.chat-item.active {
  background: #f0f0f0;
}

.chat-avatar {
  position: relative;
  flex-shrink: 0;
}

.chat-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.unread-badge {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #0095f6;
  border-radius: 50%;
  border: 2px solid white;
}

.chat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.chat-username {
  font-weight: 600;
  font-size: 14px;
}

.chat-last-message {
  font-size: 13px;
  color: #8e8e8e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-time {
  font-size: 12px;
  color: #8e8e8e;
}

.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-active {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  display: flex;
}

.message.them {
  justify-content: flex-start;
}

.message.me {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 60%;
  padding: 10px 15px;
  border-radius: 20px;
  background: #efefef;
}

.message.me .message-bubble {
  background: #0095f6;
  color: white;
}

.message-bubble p {
  margin: 0;
  font-size: 14px;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  display: block;
  margin-top: 5px;
}

.chat-input-container {
  display: flex;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #dbdbdb;
}

.chat-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #dbdbdb;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
}

.send-btn {
  padding: 10px 15px;
  background: #0095f6;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
}

.send-btn:hover {
  background: #0081d6;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  color: #dbdbdb;
  margin-bottom: 20px;
}

.chat-empty h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 10px;
}

.chat-empty p {
  color: #8e8e8e;
  margin: 0;
}

@media (max-width: 735px) {
  .chats-sidebar {
    width: 100%;
  }

  .chat-window {
    display: none;
  }
}
</style>
