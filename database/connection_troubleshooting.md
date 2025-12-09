# Решение проблем с подключением

## Ошибка: "Connection lost: The server closed the connection"

### Решение 1: Проверьте данные подключения

Убедитесь, что используете **точно** эти данные:

```
Connection Name: Bibliotechka Docker
Host: localhost
Port: 3306
User: bibliotechka_user
Password: user_password_change_me
Database: bibliotechka
```

**Важно:**
- Host должен быть именно `localhost`, не `127.0.0.1` или IP адрес
- Пароль: `user_password_change_me` (без пробелов)

### Решение 2: Дополнительные настройки

В расширении Database Client попробуйте добавить:

**Connection Options (если есть):**
```
connectTimeout: 10000
ssl: false
```

### Решение 3: Проверка через командную строку

```bash
# Проверка, что контейнер работает
docker ps | grep mysql

# Проверка подключения
docker exec -it bibliotechka-mysql mysql -u bibliotechka_user -puser_password_change_me bibliotechka
```

### Решение 4: Перезапуск контейнера

```bash
docker-compose restart
```

### Решение 5: Проверка логов

```bash
docker-compose logs mysql | tail -20
```

Если видите ошибки в логах, это поможет понять проблему.

### Решение 6: Альтернативное подключение

Попробуйте подключиться через другой инструмент:
- MySQL Workbench
- DBeaver
- phpMyAdmin (если установлен локально)

Если там работает, значит проблема в расширении VS Code/Cursor.

### Решение 7: Обновление расширения

1. Откройте расширения
2. Найдите "Database Client"
3. Обновите до последней версии
4. Перезапустите редактор

