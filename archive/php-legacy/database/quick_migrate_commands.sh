#!/bin/bash
# Быстрые команды для переноса БД на сервер myjino.ru
# 
# Настройки сервера:
# - MySQL хост: mysql.35401aca832c.hosting.myjino.ru
# - Пользователь: j35045845_biblio
# - Пароль: tuhrih-zoqmYp
# - База данных: j35045845_biblio

# ============================================
# СПОСОБ 1: Прямое подключение (если MySQL доступен)
# ============================================

echo "📦 Создание бэкапа и перенос на сервер..."

docker exec bibliotechka-mysql mysqldump \
  -u bibliotechka_user \
  -puser_password_change_me \
  --no-tablespaces \
  --default-character-set=utf8mb4 \
  --single-transaction \
  bibliotechka | \
mysql \
  -h mysql.35401aca832c.hosting.myjino.ru \
  -P 3306 \
  -u j35045845_biblio \
  -ptuhrih-zoqmYp \
  j35045845_biblio

echo "✅ Готово!"

# ============================================
# СПОСОБ 2: Через файл (если прямое подключение не работает)
# ============================================

# Создать бэкап:
# docker exec bibliotechka-mysql mysqldump \
#   -u bibliotechka_user \
#   -puser_password_change_me \
#   --no-tablespaces \
#   --default-character-set=utf8mb4 \
#   bibliotechka > backup.sql
#
# Импортировать:
# mysql -h mysql.35401aca832c.hosting.myjino.ru \
#   -u j35045845_biblio \
#   -ptuhrih-zoqmYp \
#   j35045845_biblio < backup.sql

