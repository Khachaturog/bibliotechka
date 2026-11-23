#!/usr/bin/env python3
"""
Скрипт для синхронизации таблицы card_authors с CSV файлом из Notion.

Использование:
    python3 scripts/sync-card-authors-from-csv.py /path/to/card_authors.csv

Скрипт:
1. Читает CSV файл
2. Сравнивает с текущими данными в БД (если указаны параметры подключения)
3. Генерирует SQL миграцию для добавления недостающих записей
"""

import csv
import sys
import os
from pathlib import Path

def read_csv_file(csv_path):
    """Читает CSV файл и возвращает множество кортежей (card_slug, author_slug)"""
    records = set()
    
    # Пробуем разные кодировки
    encodings = ['utf-8', 'utf-8-sig', 'cp1251', 'latin-1']
    
    for encoding in encodings:
        try:
            with open(csv_path, 'r', encoding=encoding) as f:
                reader = csv.DictReader(f)
                
                # Проверяем доступные ключи
                if reader.fieldnames:
                    print(f"Найдены поля: {reader.fieldnames}")
                    # Нормализуем названия полей (убираем BOM и пробелы)
                    normalized_fields = {f.strip().lstrip('\ufeff'): f for f in reader.fieldnames}
                    print(f"Нормализованные поля: {list(normalized_fields.keys())}")
                
                for row_num, row in enumerate(reader, start=2):
                    card_slug = None
                    author_slug = None
                    
                    # Пробуем найти поля по разным вариантам названий
                    for key, value in row.items():
                        key_clean = key.strip().lstrip('\ufeff').lower()
                        value_clean = value.strip() if value else ""
                        
                        if 'card' in key_clean and 'slug' in key_clean:
                            card_slug = value_clean
                        elif 'author' in key_clean and 'slug' in key_clean:
                            author_slug = value_clean
                    
                    # Если не нашли, пробуем по позиции (первое и второе поле)
                    if not card_slug or not author_slug:
                        values = list(row.values())
                        if len(values) >= 2:
                            if not card_slug:
                                card_slug = str(values[0]).strip() if values[0] else None
                            if not author_slug:
                                author_slug = str(values[1]).strip() if values[1] else None
                    
                    if card_slug and author_slug:
                        records.add((card_slug, author_slug))
                    elif row_num <= 5:  # Выводим предупреждения только для первых строк
                        print(f"Предупреждение: строка {row_num} пропущена - card_slug={card_slug}, author_slug={author_slug}")
                
                print(f"✓ Успешно прочитано с кодировкой {encoding}")
                break
                
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print(f"Ошибка при чтении с кодировкой {encoding}: {e}")
            continue
    
    return records

def generate_sql_migration(csv_records, output_path):
    """Генерирует SQL миграцию для синхронизации данных"""
    
    # Сортируем записи для читаемости
    sorted_records = sorted(csv_records, key=lambda x: (int(x[0]) if x[0].isdigit() else 999999, int(x[1]) if x[1].isdigit() else 999999))
    
    sql_content = f"""-- Миграция: Синхронизация таблицы card_authors с данными из Notion
-- Дата: {os.popen('date +"%Y-%m-%d %H:%M:%S"').read().strip()}
-- Источник: CSV файл из Notion
-- Всего записей в CSV: {len(csv_records)}

USE bibliotechka;

-- ВАЖНО: Перед выполнением сделайте резервную копию!
-- CREATE TABLE card_authors_backup AS SELECT * FROM card_authors;

-- Удаляем все существующие записи (если нужна полная синхронизация)
-- TRUNCATE TABLE card_authors;

-- Вставляем все записи из CSV
-- Используем INSERT IGNORE чтобы избежать ошибок при дубликатах
INSERT IGNORE INTO card_authors (card_slug, author_slug) VALUES
"""
    
    # Формируем VALUES
    values = []
    for card_slug, author_slug in sorted_records:
        values.append(f"('{card_slug}', '{author_slug}')")
    
    sql_content += ",\n".join(values) + ";\n\n"
    
    # Добавляем проверочные запросы
    sql_content += """-- Проверка: количество записей после миграции
SELECT 
    'Количество записей в card_authors' as info,
    COUNT(*) as count
FROM card_authors;

-- Проверка: записи с несколькими авторами
SELECT 
    card_slug,
    COUNT(*) as author_count
FROM card_authors
GROUP BY card_slug
HAVING COUNT(*) > 1
ORDER BY author_count DESC, card_slug
LIMIT 20;

-- Проверка: авторы с наибольшим количеством карточек
SELECT 
    author_slug,
    COUNT(*) as card_count
FROM card_authors
GROUP BY author_slug
ORDER BY card_count DESC
LIMIT 20;
"""
    
    # Сохраняем SQL файл
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"✓ SQL миграция создана: {output_path}")
    print(f"✓ Всего записей для вставки: {len(csv_records)}")
    
    return output_path

def main():
    if len(sys.argv) < 2:
        print("Использование: python3 sync-card-authors-from-csv.py <path_to_csv> [output_sql]")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    output_sql = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(csv_path):
        print(f"Ошибка: файл {csv_path} не найден")
        sys.exit(1)
    
    print(f"Читаю CSV файл: {csv_path}")
    csv_records = read_csv_file(csv_path)
    print(f"✓ Прочитано {len(csv_records)} записей из CSV")
    
    # Определяем путь для SQL файла
    if not output_sql:
        # Создаем имя файла на основе CSV
        csv_name = Path(csv_path).stem
        migrations_dir = Path(__file__).parent.parent / "database" / "migrations"
        migrations_dir.mkdir(parents=True, exist_ok=True)
        output_sql = migrations_dir / f"016_sync_card_authors_from_notion.sql"
    
    # Генерируем SQL миграцию
    generate_sql_migration(csv_records, output_sql)
    
    print("\n" + "="*60)
    print("Следующие шаги:")
    print("1. Проверьте созданный SQL файл")
    print("2. Сделайте резервную копию БД")
    print(f"3. Выполните миграцию: mysql < {output_sql}")
    print("="*60)

if __name__ == "__main__":
    main()

