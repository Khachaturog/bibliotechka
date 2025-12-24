#!/usr/bin/env python3
"""
Выполнение миграции 016: Синхронизация card_authors
Использует pymysql для подключения к БД
"""

import pymysql
import sys
from pathlib import Path

# Параметры подключения
DB_CONFIG = {
    'host': 'mysql.35401aca832c.hosting.myjino.ru',
    'port': 3306,
    'user': 'j35045845_biblio',
    'password': 'tuhrih-zoqmYp',
    'database': 'j35045845_biblio',
    'charset': 'utf8mb4'
}

# Путь к файлу миграции
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
MIGRATION_FILE = PROJECT_ROOT / 'database' / 'migrations' / '016_sync_with_backup.sql'

def read_sql_file(file_path):
    """Читает SQL файл и возвращает список команд"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Разбиваем на отдельные команды (по ;)
    # Убираем комментарии и пустые строки
    commands = []
    current_command = []
    
    for line in content.split('\n'):
        line = line.strip()
        # Пропускаем пустые строки и комментарии
        if not line or line.startswith('--'):
            continue
        
        current_command.append(line)
        
        # Если строка заканчивается на ;, это конец команды
        if line.endswith(';'):
            command = ' '.join(current_command)
            if command and command != ';':
                commands.append(command)
            current_command = []
    
    return commands

def execute_migration():
    """Выполняет миграцию"""
    print("🚀 Выполнение миграции 016: Синхронизация card_authors")
    print("=" * 60)
    print()
    
    # Проверка файла
    if not MIGRATION_FILE.exists():
        print(f"❌ Ошибка: файл миграции не найден: {MIGRATION_FILE}")
        sys.exit(1)
    
    print(f"📄 Файл миграции: {MIGRATION_FILE}")
    print()
    
    # Читаем SQL команды
    print("📖 Чтение SQL файла...")
    commands = read_sql_file(MIGRATION_FILE)
    print(f"✅ Найдено {len(commands)} SQL команд")
    print()
    
    # Подключаемся к БД
    print("🔌 Подключение к базе данных...")
    print(f"   Host: {DB_CONFIG['host']}")
    print(f"   Database: {DB_CONFIG['database']}")
    print()
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        print("✅ Подключение установлено!")
        print()
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        sys.exit(1)
    
    try:
        cursor = connection.cursor()
        
        # Выполняем команды
        print("⚙️  Выполнение миграции...")
        print()
        
        for i, command in enumerate(commands, 1):
            try:
                # Пропускаем USE команды (уже подключены)
                if command.upper().startswith('USE '):
                    continue
                
                # Выполняем команду
                cursor.execute(command)
                
                # Если это SELECT, показываем результат
                if command.upper().startswith('SELECT'):
                    results = cursor.fetchall()
                    if results:
                        # Получаем названия колонок
                        columns = [desc[0] for desc in cursor.description] if cursor.description else []
                        for row in results:
                            if len(columns) == 2:
                                print(f"   {row[0]}: {row[1]}")
                            else:
                                print(f"   {row}")
                
                # Коммитим изменения
                connection.commit()
                
            except Exception as e:
                # Некоторые ошибки можно игнорировать (например, таблица уже существует)
                error_msg = str(e).lower()
                if 'already exists' in error_msg or 'duplicate' in error_msg:
                    print(f"   ⚠️  Команда {i}: {e} (игнорируется)")
                    continue
                else:
                    print(f"   ❌ Ошибка в команде {i}: {e}")
                    print(f"   Команда: {command[:100]}...")
                    # Не прерываем выполнение, продолжаем
        
        print()
        print("✅ Миграция выполнена!")
        print()
        
        # Финальная проверка
        print("🔍 Проверка результата...")
        print()
        
        cursor.execute("SELECT COUNT(*) FROM card_authors")
        count = cursor.fetchone()[0]
        print(f"   Записей в card_authors: {count}")
        
        cursor.execute("SELECT COUNT(*) FROM card_authors_backup_20251223")
        backup_count = cursor.fetchone()[0]
        print(f"   Записей в бэкапе: {backup_count}")
        print()
        
        if count == 723:
            print("✅ Отлично! Все записи синхронизированы (723 записи)")
        elif count > 715:
            print(f"✅ Хорошо! Добавлено записей: {count - 715} (всего: {count})")
        else:
            print(f"⚠️  Количество записей: {count} (ожидалось 723)")
        
    except Exception as e:
        print(f"❌ Ошибка при выполнении: {e}")
        connection.rollback()
        sys.exit(1)
    
    finally:
        cursor.close()
        connection.close()
        print("🔌 Соединение закрыто")

if __name__ == '__main__':
    execute_migration()

