# Массовая замена текста в базе данных

Инструменты для массовой замены текста в БД (аналог "Найти и заменить").

## ⚠️ Важно: Сначала сделайте резервную копию!

Перед любыми массовыми изменениями обязательно создайте бэкап:

```bash
mysqldump -h mysql.35401aca832c.hosting.myjino.ru -u j35045845_biblio -ptuhrih-zoqmYp j35045845_biblio > backup_before_replace_$(date +%Y%m%d_%H%M%S).sql
```

Или используйте готовый скрипт:
```bash
./scripts/create-backup.sh
```

## 📋 Способы замены

### 1. Python скрипт (рекомендуется) - с предпросмотром

**Установка зависимостей (если нужно):**
```bash
pip3 install pymysql
```

**Использование:**

```bash
# Только предпросмотр (безопасно, ничего не меняет)
python3 scripts/mass-text-replace.py --old "старый текст" --new "новый текст" --table data --column title --preview-only

# Замена в одной колонке
python3 scripts/mass-text-replace.py --old "старый текст" --new "новый текст" --table data --column title

# Замена во всех текстовых колонках таблицы
python3 scripts/mass-text-replace.py --old "старый текст" --new "новый текст" --table data --all-columns

# Замена с условием (только для определенной группы)
python3 scripts/mass-text-replace.py --old "старый текст" --new "новый текст" --table data --all-columns --where "group_slug = 'designsystem'"
```

**Преимущества:**
- ✅ Показывает предпросмотр изменений перед заменой
- ✅ Подтверждение перед выполнением
- ✅ Показывает примеры того, что будет изменено
- ✅ Безопасно: можно посмотреть без изменений

### 2. Bash скрипт (быстро)

```bash
./scripts/mass-text-replace.sh "старый текст" "новый текст" data title
```

**Примеры:**
```bash
# Замена в title
./scripts/mass-text-replace.sh "старое название" "новое название" data title

# Замена URL
./scripts/mass-text-replace.sh "https://old.url" "https://new.url" data url_1
```

### 3. SQL напрямую

Откройте файл `../mass_text_replace.sql` - там есть примеры SQL запросов.

**Пример через MySQL клиент:**
```bash
mysql -h mysql.35401aca832c.hosting.myjino.ru -u j35045845_biblio -ptuhrih-zoqmYp j35045845_biblio -e "UPDATE \`data\` SET \`title\` = REPLACE(\`title\`, 'старый текст', 'новый текст') WHERE \`title\` LIKE '%старый текст%';"
```

**Пример через phpMyAdmin:**
1. Откройте phpMyAdmin
2. Выберите базу `j35045845_biblio`
3. Вкладка "SQL"
4. Вставьте и выполните SQL (примеры в `../mass_text_replace.sql`)

## 📊 Доступные таблицы и колонки

### Таблица `data`
- `title` - Название
- `description` - Описание
- `detail` - Детали
- `comment` - Комментарий
- `summary_ai` - AI саммари

### Таблица `groups`
- `title_ru`, `title_en` - Названия
- `description_ru` - Описание

### Таблица `subgroups`
- `title_ru`, `title_en` - Названия
- `description_ru` - Описание

### Таблица `authors`
- `title_ru`, `title_en` - Названия

### Таблица `versions`
- `title` - Название
- `description` - Описание

## 💡 Примеры использования

### Замена старого домена на новый
```bash
python3 scripts/mass-text-replace.py --old "old-domain.com" --new "new-domain.com" --table data --all-columns
```

### Замена текста только в определенной группе
```bash
python3 scripts/mass-text-replace.py \
  --old "UI Kit" \
  --new "Дизайн-система" \
  --table data \
  --column title \
  --where "group_slug = 'designsystem'"
```

### Замена во всех описаниях
```bash
python3 scripts/mass-text-replace.py \
  --old "устаревший термин" \
  --new "актуальный термин" \
  --table data \
  --all-columns \
  --preview-only
```

## 🔍 Проверка перед заменой

Всегда используйте `--preview-only` сначала, чтобы увидеть:
- Сколько записей будет затронуто
- Примеры того, как будут выглядеть изменения
- Убедиться, что замена правильная

## ⚠️ Важные замечания

1. **Всегда делайте бэкап перед массовыми изменениями**
2. **Используйте `--preview-only` для проверки**
3. **Проверяйте результаты после замены**
4. **Будьте осторожны с URL и путями** - они могут быть в разных форматах
5. **Чувствительность к регистру**: MySQL `REPLACE()` чувствительна к регистру по умолчанию

## 🐛 Откат изменений

Если что-то пошло не так, используйте резервную копию для восстановления:

```bash
mysql -h mysql.35401aca832c.hosting.myjino.ru -u j35045845_biblio -ptuhrih-zoqmYp j35045845_biblio < backup_before_replace_YYYYMMDD_HHMMSS.sql
```

