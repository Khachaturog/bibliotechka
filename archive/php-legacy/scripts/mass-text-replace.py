#!/usr/bin/env python3
"""
Безопасная массовая замена текста в базе данных с предпросмотром изменений.

Использование:
    python3 scripts/mass-text-replace.py --old "старый текст" --new "новый текст" --table data --column title
    python3 scripts/mass-text-replace.py --old "старый текст" --new "новый текст" --table data --column title --preview-only
    python3 scripts/mass-text-replace.py --old "старый текст" --new "новый текст" --table data --all-columns --where "group_slug = 'designsystem'"
"""

import sys
import argparse
import pymysql
from pymysql.cursors import DictCursor
from datetime import datetime

# Настройки подключения к БД
DB_CONFIG = {
    'host': 'mysql.35401aca832c.hosting.myjino.ru',
    'port': 3306,
    'user': 'j35045845_biblio',
    'password': 'tuhrih-zoqmYp',
    'database': 'j35045845_biblio',
    'charset': 'utf8mb4'
}

# Маппинг таблиц и их текстовых колонок
TABLE_COLUMNS = {
    'data': ['title', 'description', 'detail', 'comment', 'summary_ai', 'cover_short', 'cover_large', 'url_1', 'url_2', 'url_3', 'url_4', 'url_5', 'url_6', 'url_seo_yandex', 'url_seo_google'],
    'groups': ['title_ru', 'title_en', 'description_ru', 'cover'],
    'subgroups': ['title_ru', 'title_en', 'description_ru'],
    'authors': ['title_ru', 'title_en', 'avatar'],
    'versions': ['title', 'description', 'url'],
}


def get_connection():
    """Создает подключение к БД"""
    try:
        conn = pymysql.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Ошибка подключения к БД: {e}", file=sys.stderr)
        sys.exit(1)


def preview_changes(conn, table, columns, old_text, where_clause=None):
    """Показывает, какие записи будут изменены"""
    cursor = conn.cursor(DictCursor)
    
    results = {}
    total_affected = 0
    
    for column in columns:
        # Формируем WHERE условие
        where = f"WHERE `{column}` LIKE %s"
        if where_clause:
            where += f" AND ({where_clause})"
        
        # Считаем количество затронутых записей
        count_query = f"SELECT COUNT(*) as count FROM `{table}` {where}"
        cursor.execute(count_query, (f'%{old_text}%',))
        count_result = cursor.fetchone()
        count = count_result['count'] if count_result else 0
        
        if count > 0:
            # Показываем примеры изменений
            preview_query = f"""
                SELECT 
                    `slug` as id,
                    `{column}` as old_value,
                    REPLACE(`{column}`, %s, %s) as new_value
                FROM `{table}`
                {where}
                LIMIT 5
            """
            cursor.execute(preview_query, (old_text, old_text, old_text))
            examples = cursor.fetchall()
            
            results[column] = {
                'count': count,
                'examples': examples
            }
            total_affected += count
    
    cursor.close()
    return results, total_affected


def execute_replace(conn, table, columns, old_text, new_text, where_clause=None):
    """Выполняет замену текста"""
    cursor = conn.cursor()
    
    affected_rows = 0
    
    for column in columns:
        # Формируем UPDATE запрос
        set_clause = f"`{column}` = REPLACE(`{column}`, %s, %s)"
        where = f"WHERE `{column}` LIKE %s"
        if where_clause:
            where += f" AND ({where_clause})"
        
        update_query = f"UPDATE `{table}` SET {set_clause} {where}"
        
        try:
            cursor.execute(update_query, (old_text, new_text, f'%{old_text}%'))
            affected_rows += cursor.rowcount
            print(f"  ✅ {column}: изменено {cursor.rowcount} записей")
        except Exception as e:
            print(f"  ❌ Ошибка при обновлении {column}: {e}", file=sys.stderr)
    
    conn.commit()
    cursor.close()
    return affected_rows


def main():
    parser = argparse.ArgumentParser(
        description='Массовая замена текста в базе данных',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры использования:

  # Предпросмотр изменений в одной колонке
  python3 scripts/mass-text-replace.py --old "старый текст" --new "новый текст" --table data --column title --preview-only

  # Замена в одной колонке
  python3 scripts/mass-text-replace.py --old "старый текст" --new "новый текст" --table data --column title

  # Замена во всех текстовых колонках таблицы
  python3 scripts/mass-text-replace.py --old "старый текст" --new "новый текст" --table data --all-columns

  # Замена с условием (только для определенной группы)
  python3 scripts/mass-text-replace.py --old "старый текст" --new "новый текст" --table data --all-columns --where "group_slug = 'designsystem'"
        """
    )
    
    parser.add_argument('--old', required=True, help='Текст для замены (старый)')
    parser.add_argument('--new', required=True, help='Новый текст')
    parser.add_argument('--table', required=True, choices=list(TABLE_COLUMNS.keys()), help='Таблица для замены')
    parser.add_argument('--column', help='Конкретная колонка для замены')
    parser.add_argument('--all-columns', action='store_true', help='Заменять во всех текстовых колонках таблицы')
    parser.add_argument('--where', help='Дополнительное WHERE условие (без ключевого слова WHERE)')
    parser.add_argument('--preview-only', action='store_true', help='Только показать предпросмотр, не выполнять замену')
    
    args = parser.parse_args()
    
    # Проверка аргументов
    if not args.column and not args.all_columns:
        print("❌ Ошибка: нужно указать либо --column, либо --all-columns", file=sys.stderr)
        sys.exit(1)
    
    if args.column and args.all_columns:
        print("❌ Ошибка: нельзя использовать --column и --all-columns одновременно", file=sys.stderr)
        sys.exit(1)
    
    # Определяем колонки для замены
    if args.all_columns:
        columns = TABLE_COLUMNS[args.table]
    else:
        if args.column not in TABLE_COLUMNS[args.table]:
            print(f"❌ Ошибка: колонка '{args.column}' не найдена в таблице '{args.table}'", file=sys.stderr)
            print(f"Доступные колонки: {', '.join(TABLE_COLUMNS[args.table])}", file=sys.stderr)
            sys.exit(1)
        columns = [args.column]
    
    # Подключаемся к БД
    conn = get_connection()
    
    try:
        print(f"🔍 Поиск записей с текстом: '{args.old}'")
        print(f"📊 Таблица: {args.table}")
        print(f"📝 Колонки: {', '.join(columns)}")
        if args.where:
            print(f"🔎 Условие: {args.where}")
        print()
        
        # Показываем предпросмотр
        results, total_affected = preview_changes(conn, args.table, columns, args.old, args.where)
        
        if total_affected == 0:
            print("✅ Записей для замены не найдено")
            return
        
        print(f"📈 Всего записей будет затронуто: {total_affected}")
        print()
        
        # Показываем примеры изменений
        for column, data in results.items():
            print(f"📌 Колонка: {column} ({data['count']} записей)")
            for example in data['examples']:
                old_val = example['old_value'][:100] + '...' if example['old_value'] and len(example['old_value']) > 100 else example['old_value']
                new_val = example['new_value'][:100] + '...' if example['new_value'] and len(example['new_value']) > 100 else example['new_value']
                print(f"   ID: {example['id']}")
                print(f"   Было: {old_val}")
                print(f"   Станет: {new_val}")
                print()
        
        if args.preview_only:
            print("👀 Режим предпросмотра - изменения не применены")
            print("   Уберите --preview-only чтобы выполнить замену")
            return
        
        # Подтверждение
        print("⚠️  ВНИМАНИЕ: Это действие изменит данные в базе!")
        response = input("Продолжить? (yes/no): ").strip().lower()
        
        if response != 'yes':
            print("❌ Операция отменена")
            return
        
        # Выполняем замену
        print()
        print("🔄 Выполняю замену...")
        affected_rows = execute_replace(conn, args.table, columns, args.old, args.new, args.where)
        
        print()
        print(f"✅ Замена завершена! Изменено записей: {affected_rows}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}", file=sys.stderr)
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    main()

