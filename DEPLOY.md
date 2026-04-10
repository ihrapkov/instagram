# 🚀 Руководство по деплою Instagram Clone

---

## 📋 Этапы деплоя

```
1. Выбор хостинга
2. Подготовка проекта
3. Настройка сервера
4. Деплой Backend
5. Деплой Frontend
6. Перенос MongoDB
7. Домен + SSL
8. Проверка
```

---

## 1️⃣ Выбор хостинга

### Вариант A: VPS (рекомендую)
| Провайдер | Цена/мес | Плюсы |
|-----------|----------|-------|
| **Timeweb Cloud** | ~300₽ | Россия, удобная панель |
| **Aeza** | ~250₽ | Россия, быстрые SSD |
| **DigitalOcean** | ~$6 | Надёжный, много документации |
| **Vultr** | ~$6 | Дешёвый, 32 локации |

**Минимальные требования:**
- CPU: 1 ядро
- RAM: 1 ГБ
- SSD: 15 ГБ
- ОС: Ubuntu 22.04

### Вариант B: Раздельный хостинг
- **Frontend** → Vercel / Netlify (бесплатно)
- **Backend** → VPS / Render / Railway
- **MongoDB** → MongoDB Atlas (бесплатно 512 МБ)

---

## 2️⃣ Подготовка проекта

### Создай `.env.production` для frontend:
```env
VITE_API_URL=https://api.твой-домен.ru/api
```

### Обнови `backend/.env` для продакшена:
```env
PORT=5000
MONGO_URI=mongodb://user:password@localhost:27017/instagram
JWT_SECRET=очень_длинный_секретный_ключ_минимум_32_символа
JWT_REFRESH_SECRET=другой_длинный_секретный_ключ_минимум_32_символа
FRONTEND_URL=https://твой-домен.ru
NODE_ENV=production
```

### Добавь в `.gitignore` секреты:
```
.env
backend/.env
backend/uploads/
node_modules/
dist/
```

---

## 3️⃣ Настройка VPS (Ubuntu 22.04)

### Подключись по SSH:
```bash
ssh root@твой-server-ip
```

### Обнови систему:
```bash
apt update && apt upgrade -y
```

### Установи Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # v20.x.x
```

### Установи MongoDB:
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
systemctl status mongod  # проверить что работает
```

### Установи Nginx:
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### Установи PM2 (процесс-менеджер):
```bash
npm install -g pm2
```

### Настрой файрвол:
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 4️⃣ Деплой Backend

### Загрузи файлы на сервер:
```bash
# С локальной машины (scp):
scp -r backend/ root@твой-server-ip:/opt/instagram-backend
```

### Или через Git:
```bash
# На сервере:
cd /opt
git clone https://github.com/ТВОЙ_USERNAME/instagram.git
cd instagram/backend
npm install --production
```

### Создай `.env`:
```bash
nano /opt/instagram-backend/.env
```
Вставь продакшен конфиги.

### Запусти через PM2:
```bash
pm2 start server.js --name instagram-backend
pm2 save
pm2 startup  # автозапуск при перезагрузке
```

### Проверь:
```bash
curl http://localhost:5000/api/health
pm2 logs instagram-backend
```

---

## 5️⃣ Деплой Frontend

### Собери проект локально:
```bash
npm run build
```
Появится папка `dist/`.

### Вариант A: Nginx на VPS
```bash
# Загрузи dist на сервер
scp -r dist/ root@твой-server-ip:/var/www/instagram-frontend

# Настрой Nginx
nano /etc/nginx/sites-available/instagram
```

**Конфиг Nginx:**
```nginx
server {
    listen 80;
    server_name твой-домен.ru www.твой-домен.ru;

    # Frontend
    location / {
        root /var/www/instagram-frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API (проксирование)
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Загруженные файлы
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
    }
}
```

```bash
# Активируй сайт
ln -s /etc/nginx/sites-available/instagram /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Вариант B: Vercel (бесплатно)
```bash
npm install -g vercel
vercel --prod
```
Обнови `VITE_API_URL` на адрес своего backend.

---

## 6️⃣ Перенос MongoDB

### Вариант A: MongoDB Atlas (облако, рекомендую)
1. Зарегистрируйся на [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Создай кластер (бесплатный M0)
3. Создай пользователя с паролем
4. В Network Access добавь `0.0.0.0/0` (или IP сервера)
5. Скопируй connection string:
   ```
   mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/instagram
   ```
6. Вставь в `backend/.env` → `MONGO_URI`

### Вариант B: Экспорт/Импорт
```bash
# На локальной машине (экспорт):
mongodump --db instagram --out ./mongo-backup

# Загрузи на сервер:
scp -r ./mongo-backup root@твой-server-ip:/tmp/

# На сервере (импорт):
mongorestore /tmp/mongo-backup/instagram
```

### Вариант C: Прямая копия
```bash
mongodump --db instagram --archive | ssh root@твой-server-ip "mongorestore --db instagram --archive"
```

---

## 7️⃣ Домен + SSL

### Купи домен:
- Reg.ru, Beget, Timeweb — от 200₽/год

### Настрой DNS:
```
A запись: твой-домен.ru → IP сервера
A запись: www.твой-домен.ru → IP сервера
```

### Получи SSL сертификат (бесплатно):
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d твой-домен.ru -d www.твой-домен.ru
```

Certbot автоматически:
- Получит сертификат Let's Encrypt
- Обновит конфиг Nginx
- Настроит автопродление

---

## 8️⃣ Проверка

```bash
# Frontend
curl https://твой-домен.ru

# Backend API
curl https://твой-домен.ru/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"password123"}'

# WebSocket (если есть)
# Проверь в браузере
```

---

## 📊 Итоговая архитектура

```
Пользователь
    │
    ▼
┌─────────────┐
│   Nginx     │  (порт 80/443)
│  Reverse    │
│   Proxy     │
└──────┬──────┘
       │
       ├── / → /var/www/instagram-frontend (Vue SPA)
       │
       ├── /api/ → localhost:5000 (Express Backend)
       │
       └── /uploads/ → localhost:5000/uploads (файлы)
                          │
                          ▼
                    ┌─────────────┐
                    │   MongoDB   │
                    │  (порт 27017)│
                    └─────────────┘
```

---

## 💰 Стоимость (пример)

| Ресурс | Цена/мес |
|--------|----------|
| VPS (1 ядро, 1 ГБ) | 250–500₽ |
| Домен .ru | 200₽/год |
| MongoDB Atlas | Бесплатно (512 МБ) |
| SSL (Let's Encrypt) | Бесплатно |
| **Итого** | **~250–500₽/мес** |

---

## 🔒 Безопасность

```bash
# 1. Отключи вход root по паролю
nano /etc/ssh/sshd_config
# PasswordAuthentication no

# 2. Настрой fail2ban
apt install -y fail2ban
systemctl enable fail2ban

# 3. Автообновления
apt install -y unattended-upgrades

# 4. Бэкапы MongoDB (cron)
crontab -e
# 0 3 * * * mongodump --db instagram --out /backup/mongo/$(date +\%Y-\%m-\%d)
```
