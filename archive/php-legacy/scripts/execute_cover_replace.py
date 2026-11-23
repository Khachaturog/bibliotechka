#!/usr/bin/env python3
"""Выполнение замены /images/covers на https://35401aca832c.hosting.myjino.ru"""

import pymysql

DB_CONFIG = {
    'host': 'mysql.35401aca832c.hosting.myjino.ru',
    'port': 3306,
    'user': 'j35045845_biblio',
    'password': 'tuhrih-zoqmYp',
    'database': 'j35045845_biblio',
    'charset': 'utf8mb4'
}

OLD_TEXT = '/images/covers'
NEW_TEXT = 'https://35401aca832c.hosting.myjino.ru'
TABLE = 'data'
COLUMN = 'cover'

print(f"🔍 Замена в таблице {TABLE}, колонка {COLUMN}")
print(f"   Старый текст: {OLD_TEXT}")
print(f"   Новый текст: {NEW_TEXT}")
print()

try:
    # Подключаемся к БД
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Проверяем, сколько записей будет затронуто
    check_query = f"SELECT COUNT(*) FROM `{TABLE}` WHERE `{COLUMN}` LIKE %s"
    cursor.execute(check_query, (f'%{OLD_TEXT}%',))
    count = cursor.fetchone()[0]
    
    print(f"📊 Найдено записей для замены: {count}")
    
    if count == 0:
        print("✅ Записей для замены не найдено")
        conn.close()
        exit(0)
    
    # Показываем пример
    example_query = f"""
        SELECT slug, `{COLUMN}` as old_value, 
               REPLACE(`{COLUMN}`, %s, %s) as new_value
        FROM `{TABLE}`
        WHERE `{COLUMN}` LIKE %s
        LIMIT 1
    """
    cursor.execute(example_query, (OLD_TEXT, NEW_TEXT, f'%{OLD_TEXT}%'))
    example = cursor.fetchone()
    
    if example:
        print(f"📌 Пример изменения:")
        print(f"   Slug: {example[0]}")
        print(f"   Было: {example[1]}")
        print(f"   Станет: {example[2]}")
        print()
    
    # Выполняем замену
    print("🔄 Выполняю замену...")
    update_query = f"""
        UPDATE `{TABLE}` 
        SET `{COLUMN}` = REPLACE(`{COLUMN}`, %s, %s)
        WHERE `{COLUMN}` LIKE %s
    """
    cursor.execute(update_query, (OLD_TEXT, NEW_TEXT, f'%{OLD_TEXT}%'))
    affected_rows = cursor.rowcount
    conn.commit()
    
    print(f"✅ Замена выполнена! Изменено записей: {affected_rows}")
    
    # Проверяем результат
    cursor.execute(check_query, (f'%{OLD_TEXT}%',))
    remaining = cursor.fetchone()[0]
    
    if remaining == 0:
        print("✅ Все записи успешно заменены!")
    else:
        print(f"⚠️  Осталось записей со старым текстом: {remaining}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Ошибка: {e}")
    if 'conn' in locals():
        conn.rollback()
        conn.close()
    exit(1)

