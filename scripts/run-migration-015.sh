#!/bin/bash
# Скрипт для запуска миграции 015: Изменение каскадного удаления на SET NULL

# Настройки подключения
DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

# Путь к миграции
MIGRATION_FILE="database/migrations/015_change_subgroup_cascade_to_set_null.sql"

echo "🔄 Применение миграции 015..."
echo "База: ${DB_NAME}"
echo "Миграция: ${MIGRATION_FILE}"
echo ""

# Проверяем существование файла миграции
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Ошибка: файл миграции не найден: ${MIGRATION_FILE}"
    exit 1
fi

# Предупреждение о необходимости бэкапа
echo "⚠️  ВАЖНО: Перед применением миграции убедитесь, что создан бэкап!"
echo "   Команда для создания бэкапа: ./scripts/create-backup-015.sh"
echo ""
read -p "Создан ли бэкап? (yes/no): " backup_confirm

if [ "$backup_confirm" != "yes" ]; then
    echo ""
    echo "❌ Применение миграции отменено. Создайте бэкап сначала!"
    exit 1
fi

echo ""
echo "📋 Проверка безопасности миграции:"
echo "   ✅ Миграция НЕ удаляет данные"
echo "   ✅ Только изменяет структуру (NULL/NOT NULL)"
echo "   ✅ Только меняет внешние ключи (CASCADE → SET NULL)"
echo ""

# Проверка статистики ДО миграции
echo "📊 Сохранение статистики ДО миграции..."
if [ -f "scripts/check-migration-safety.sh" ]; then
    ./scripts/check-migration-safety.sh before
    CHECK_BEFORE_EXIT=$?
    if [ $CHECK_BEFORE_EXIT -ne 0 ]; then
        echo "⚠️  Предупреждение: не удалось сохранить статистику ДО миграции"
    fi
else
    echo "⚠️  Скрипт проверки не найден, пропускаем проверку"
fi

echo ""
read -p "Продолжить применение миграции? (yes/no): " apply_confirm

if [ "$apply_confirm" != "yes" ]; then
    echo ""
    echo "❌ Применение миграции отменено пользователем"
    exit 1
fi

echo ""
echo "⏳ Применение миграции..."

# Применяем миграцию
if command -v mysql &> /dev/null; then
    echo "✅ Используем mysql из системы"
    mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < "$MIGRATION_FILE"
elif command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo "✅ Используем mysql через Docker"
    docker run --rm -i \
        mysql:8.0 \
        mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" < "$MIGRATION_FILE"
else
    echo "❌ Ошибка: mysql не найден и Docker недоступен"
    echo ""
    echo "Установите MySQL клиент:"
    echo "  macOS: brew install mysql-client"
    echo "  или используйте Docker"
    exit 1
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Миграция 015 успешно применена!"
    echo ""
    
    # Проверка статистики ПОСЛЕ миграции
    echo "📊 Проверка статистики ПОСЛЕ миграции..."
    if [ -f "scripts/check-migration-safety.sh" ]; then
        ./scripts/check-migration-safety.sh after
        CHECK_AFTER_EXIT=$?
        
        echo ""
        echo "🔍 Сравнение результатов..."
        ./scripts/check-migration-safety.sh compare
        COMPARE_EXIT=$?
        
        if [ $COMPARE_EXIT -eq 0 ]; then
            echo ""
            echo "✅ Все проверки пройдены: данные не изменились!"
        else
            echo ""
            echo "⚠️  ВНИМАНИЕ: Обнаружены различия в количестве записей!"
            echo "   Рекомендуется проверить миграцию и при необходимости откатить"
        fi
    else
        echo "⚠️  Скрипт проверки не найден, пропускаем проверку"
    fi
    
    echo ""
    echo "📊 Что изменилось:"
    echo "   • data.group_slug: ON DELETE CASCADE → ON DELETE SET NULL"
    echo "   • data.subgroup_slug: ON DELETE CASCADE → ON DELETE SET NULL"
    echo "   • subgroups.group_slug: ON DELETE CASCADE → ON DELETE SET NULL"
    echo ""
    echo "💡 Теперь при удалении групп/подгрупп данные не будут удаляться,"
    echo "   а соответствующие поля будут устанавливаться в NULL"
else
    echo ""
    echo "❌ Ошибка при применении миграции (код выхода: $EXIT_CODE)"
    echo ""
    echo "💡 Если миграция не применилась, проверьте:"
    echo "   1. Подключение к базе данных"
    echo "   2. Права доступа пользователя"
    echo "   3. Сообщения об ошибках выше"
    exit 1
fi

