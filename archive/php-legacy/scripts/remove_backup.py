#!/usr/bin/env python3
"""Удаление резервной копии card_authors_backup_20251223"""

import pymysql

DB_CONFIG = {
    'host': 'mysql.35401aca832c.hosting.myjino.ru',
    'port': 3306,
    'user': 'j35045845_biblio',
    'password': 'tuhrih-zoqmYp',
    'database': 'j35045845_biblio',
    'charset': 'utf8mb4'
}

print("🗑️  Удаление резервной копии card_authors_backup_20251223")
print()

try:
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Проверяем, что основная таблица в порядке
    cursor.execute("SELECT COUNT(*) FROM card_authors")
    main_count = cursor.fetchone()[0]
    print(f"✅ Записей в card_authors: {main_count}")
    
    # Проверяем наличие бэкапа
    cursor.execute("SHOW TABLES LIKE 'card_authors_backup_20251223'")
    backup_exists = cursor.fetchone()
    
    if backup_exists:
        cursor.execute("SELECT COUNT(*) FROM card_authors_backup_20251223")
        backup_count = cursor.fetchone()[0]
        print(f"📦 Записей в бэкапе: {backup_count}")
        print()
        
        # Удаляем
        cursor.execute("DROP TABLE IF EXISTS card_authors_backup_20251223")
        conn.commit()
        print("✅ Резервная копия удалена!")
    else:
        print("ℹ️  Резервная копия не найдена (уже удалена?)")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Ошибка: {e}")

