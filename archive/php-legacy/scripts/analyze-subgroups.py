#!/usr/bin/env python3
"""
Скрипт для анализа пересечений подгрупп между группами
"""

import re
from collections import defaultdict

# Читаем SQL файл
sql_file = 'backups/backup_for_server_20251214_155458.sql'

try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Находим строку INSERT INTO `data`
    insert_match = re.search(r"INSERT INTO `data` VALUES \((.+)\);", content, re.DOTALL)
    
    if not insert_match:
        print("Не найдена строка INSERT INTO data")
        exit(1)
    
    # Парсим значения (они разделены запятыми, но нужно учитывать экранированные кавычки)
    values_str = insert_match.group(1)
    
    # Простой парсер: разбиваем по ),(' чтобы получить отдельные записи
    records = re.split(r"\),\s*\('", values_str)
    
    # Обрабатываем первую и последнюю запись отдельно
    if records:
        records[0] = records[0].lstrip("('")
        records[-1] = records[-1].rstrip("')")
    
    # Собираем статистику
    group_subgroup_count = defaultdict(int)
    subgroup_to_groups = defaultdict(set)
    group_to_subgroups = defaultdict(set)
    
    for record in records:
        # Разбиваем запись на поля (примерно на 10-11 позициях должны быть group_slug и subgroup_slug)
        # Формат: 'slug','title','cover',...,'group_slug','subgroup_slug',...
        fields = []
        current_field = ""
        in_quotes = False
        escape_next = False
        
        for char in record:
            if escape_next:
                current_field += char
                escape_next = False
            elif char == '\\':
                escape_next = True
                current_field += char
            elif char == "'" and not escape_next:
                if in_quotes:
                    fields.append(current_field)
                    current_field = ""
                    in_quotes = False
                else:
                    in_quotes = True
            elif char == ',' and not in_quotes:
                if current_field:
                    fields.append(current_field)
                    current_field = ""
            else:
                current_field += char
        
        if current_field:
            fields.append(current_field)
        
        # Пытаемся найти group_slug и subgroup_slug (обычно на позициях 9 и 10, индексы 8 и 9)
        if len(fields) >= 11:
            try:
                group_slug = fields[9].strip("'")
                subgroup_slug = fields[10].strip("'")
                
                if group_slug and subgroup_slug:
                    group_subgroup_count[(group_slug, subgroup_slug)] += 1
                    subgroup_to_groups[subgroup_slug].add(group_slug)
                    group_to_subgroups[group_slug].add(subgroup_slug)
            except (IndexError, AttributeError):
                pass
    
    # Выводим результаты
    print("=" * 80)
    print("ПОДГРУППЫ, ИСПОЛЬЗУЕМЫЕ В НЕСКОЛЬКИХ ГРУППАХ (ПРОБЛЕМНЫЕ)")
    print("=" * 80)
    print()
    
    problematic = {k: v for k, v in subgroup_to_groups.items() if len(v) > 1}
    
    if problematic:
        for subgroup, groups in sorted(problematic.items(), key=lambda x: len(x[1]), reverse=True):
            print(f"🔴 {subgroup}")
            print(f"   Используется в {len(groups)} группах: {', '.join(sorted(groups))}")
            for group in sorted(groups):
                count = group_subgroup_count[(group, subgroup)]
                print(f"      - {group}: {count} карточек")
            print()
    else:
        print("✅ Нет пересечений! Все подгруппы используются только в одной группе.")
        print()
    
    print("=" * 80)
    print("СТАТИСТИКА ПО ГРУППАМ")
    print("=" * 80)
    print()
    
    for group in sorted(group_to_subgroups.keys()):
        subgroups = group_to_subgroups[group]
        print(f"📁 {group}")
        print(f"   Подгрупп: {len(subgroups)}")
        print(f"   Список: {', '.join(sorted(subgroups))}")
        print()
    
    print("=" * 80)
    print("ВСЕ КОМБИНАЦИИ GROUP + SUBGROUP")
    print("=" * 80)
    print()
    
    for (group, subgroup), count in sorted(group_subgroup_count.items()):
        print(f"{group:20} + {subgroup:30} = {count:4} карточек")

except FileNotFoundError:
    print(f"Файл {sql_file} не найден")
except Exception as e:
    print(f"Ошибка: {e}")
    import traceback
    traceback.print_exc()

