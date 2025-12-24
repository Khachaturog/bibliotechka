#!/bin/bash
# Скрипт для проверки безопасности миграции
# Проверяет количество записей и размер БД до и после миграции

# Настройки подключения
DB_HOST="mysql.35401aca832c.hosting.myjino.ru"
DB_PORT="3306"
DB_USER="j35045845_biblio"
DB_PASSWORD="tuhrih-zoqmYp"
DB_NAME="j35045845_biblio"

# Файлы для сохранения статистики
STATS_BEFORE_FILE="/tmp/migration_stats_before.txt"
STATS_AFTER_FILE="/tmp/migration_stats_after.txt"

# Функция для получения статистики по таблицам
get_table_stats() {
    local output_file=$1
    
    docker run --rm -i mysql:8.0 mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" \
        -e "
        SELECT 
            'groups' as table_name, 
            COUNT(*) as record_count,
            ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024, 2) as size_kb
        FROM groups
        CROSS JOIN (
            SELECT 
                DATA_LENGTH + INDEX_LENGTH as table_size
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = '$DB_NAME' AND TABLE_NAME = 'groups'
        ) as size_info
        UNION ALL
        SELECT 'subgroups', COUNT(*), 
            (SELECT ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = '$DB_NAME' AND TABLE_NAME = 'subgroups')
        FROM subgroups
        UNION ALL
        SELECT 'data', COUNT(*), 
            (SELECT ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = '$DB_NAME' AND TABLE_NAME = 'data')
        FROM data
        UNION ALL
        SELECT 'authors', COUNT(*), 
            (SELECT ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = '$DB_NAME' AND TABLE_NAME = 'authors')
        FROM authors
        UNION ALL
        SELECT 'card_authors', COUNT(*), 
            (SELECT ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = '$DB_NAME' AND TABLE_NAME = 'card_authors')
        FROM card_authors
        UNION ALL
        SELECT 'versions', COUNT(*), 
            (SELECT ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = '$DB_NAME' AND TABLE_NAME = 'versions')
        FROM versions
        ORDER BY table_name;
    " > "$output_file" 2>/dev/null
    
    # Также получаем общий размер БД
    docker run --rm -i mysql:8.0 mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" \
        -e "
        SELECT 
            ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_size_mb
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = '$DB_NAME';
    " >> "$output_file" 2>/dev/null
}

# Функция для простого подсчета записей (более надежный способ)
get_simple_counts() {
    local output_file=$1
    
    docker run --rm -i mysql:8.0 mysql \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        -p"$DB_PASSWORD" \
        "$DB_NAME" \
        -e "
        SELECT 'groups' as table_name, COUNT(*) as count FROM groups
        UNION ALL SELECT 'subgroups', COUNT(*) FROM subgroups
        UNION ALL SELECT 'data', COUNT(*) FROM data
        UNION ALL SELECT 'authors', COUNT(*) FROM authors
        UNION ALL SELECT 'card_authors', COUNT(*) FROM card_authors
        UNION ALL SELECT 'versions', COUNT(*) FROM versions
        ORDER BY table_name;
    " > "$output_file" 2>/dev/null
}

# Функция для сравнения результатов
compare_stats() {
    echo "🔍 Сравнение статистики до и после миграции..."
    echo ""
    
    if [ ! -f "$STATS_BEFORE_FILE" ]; then
        echo "❌ Ошибка: файл статистики ДО миграции не найден"
        echo "   Запустите скрипт с параметром 'before' перед миграцией"
        return 1
    fi
    
    if [ ! -f "$STATS_AFTER_FILE" ]; then
        echo "❌ Ошибка: файл статистики ПОСЛЕ миграции не найден"
        echo "   Запустите скрипт с параметром 'after' после миграции"
        return 1
    fi
    
    # Сравниваем количество записей
    echo "📊 Количество записей в таблицах:"
    echo ""
    echo "Таблица           | До миграции | После миграции | Статус"
    echo "------------------|-------------|----------------|--------"
    
    local all_match=true
    
    while IFS=$'\t' read -r table_before count_before; do
        if [[ "$table_before" == "table_name" ]]; then
            continue
        fi
        
        # Находим соответствующую запись в файле "после"
        count_after=$(grep "^$table_before" "$STATS_AFTER_FILE" | cut -f2)
        
        if [ -z "$count_after" ]; then
            echo "❌ $table_before         | $count_before      | НЕ НАЙДЕНО     | ОШИБКА"
            all_match=false
        elif [ "$count_before" = "$count_after" ]; then
            echo "✅ $table_before         | $count_before      | $count_after      | OK"
        else
            echo "❌ $table_before         | $count_before      | $count_after      | РАЗЛИЧАЮТСЯ"
            all_match=false
        fi
    done < "$STATS_BEFORE_FILE"
    
    echo ""
    
    if [ "$all_match" = true ]; then
        echo "✅ Все проверки пройдены: количество записей идентично!"
        
        # Дополнительная проверка: размер бэкапа
        echo ""
        echo "📦 Проверка размера бэкапа (опционально):"
        BACKUP_FILES=$(ls -t backups/backup_before_migration_015_*.sql 2>/dev/null | head -1)
        if [ -n "$BACKUP_FILES" ]; then
            BACKUP_SIZE_FILE="${BACKUP_FILES}.size"
            if [ -f "$BACKUP_SIZE_FILE" ]; then
                BACKUP_SIZE=$(cat "$BACKUP_SIZE_FILE")
                CURRENT_SIZE=$(stat -f%z "$BACKUP_FILES" 2>/dev/null || stat -c%s "$BACKUP_FILES" 2>/dev/null || wc -c < "$BACKUP_FILES" | tr -d ' ')
                if [ "$BACKUP_SIZE" = "$CURRENT_SIZE" ]; then
                    echo "   ✅ Размер бэкапа не изменился: ${BACKUP_SIZE} байт"
                else
                    echo "   ⚠️  Размер бэкапа изменился: было ${BACKUP_SIZE}, стало ${CURRENT_SIZE}"
                    echo "      (это может быть нормально, если миграция изменяет структуру)"
                fi
            fi
        fi
        
        return 0
    else
        echo "❌ ОШИБКА: Обнаружены различия в количестве записей!"
        echo "   Рекомендуется откатить миграцию и проверить её безопасность"
        return 1
    fi
}

# Основная логика
case "$1" in
    before)
        echo "📊 Сохранение статистики ДО миграции..."
        get_simple_counts "$STATS_BEFORE_FILE"
        echo "✅ Статистика сохранена в $STATS_BEFORE_FILE"
        echo ""
        echo "Текущее количество записей:"
        cat "$STATS_BEFORE_FILE"
        ;;
    after)
        echo "📊 Сохранение статистики ПОСЛЕ миграции..."
        get_simple_counts "$STATS_AFTER_FILE"
        echo "✅ Статистика сохранена в $STATS_AFTER_FILE"
        echo ""
        echo "Текущее количество записей:"
        cat "$STATS_AFTER_FILE"
        ;;
    compare)
        compare_stats
        ;;
    *)
        echo "Использование: $0 {before|after|compare}"
        echo ""
        echo "  before   - Сохранить статистику ДО миграции"
        echo "  after    - Сохранить статистику ПОСЛЕ миграции"
        echo "  compare  - Сравнить статистику до и после"
        echo ""
        echo "Пример использования:"
        echo "  1. $0 before      # Перед миграцией"
        echo "  2. # Применить миграцию"
        echo "  3. $0 after       # После миграции"
        echo "  4. $0 compare     # Сравнить результаты"
        exit 1
        ;;
esac

