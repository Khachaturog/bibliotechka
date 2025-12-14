#!/bin/bash
# Скрипт для запуска PHP API сервера

# Получаем локальный IP адрес
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' || ipconfig getifaddr en0 2>/dev/null || echo "localhost")

echo "🚀 Запуск PHP API сервера..."
echo "📡 Локально: http://localhost:8000"
echo "📱 С телефона (в той же Wi-Fi сети): http://${LOCAL_IP}:8000"
echo ""
echo "Эндпоинты:"
echo "  - http://${LOCAL_IP}:8000/api/v1/groups/list"
echo "  - http://${LOCAL_IP}:8000/api/v1/groups?slug=designsystem"
echo "  - http://${LOCAL_IP}:8000/api/v1/data/list"
echo ""
echo "⚠️  Убедитесь, что телефон подключен к той же Wi-Fi сети!"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

# Запускаем встроенный PHP сервер на всех интерфейсах (0.0.0.0)
# Используем router.php как роутер для обработки /api/* запросов (напрямую через api/index.php)
# Остальные запросы будут обрабатываться как статические файлы
php -S 0.0.0.0:8000 -t . router.php

