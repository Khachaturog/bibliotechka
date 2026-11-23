# Миграция 019: cover_short / cover_large

## Что делает

- **data**: добавляет `cover_short`, `cover_large`; заполняет из slug (`.../short/{slug}.webp`, `.../large/{slug}.webp`); удаляет `cover` и `cover_notion`.
- **groups**: удаляет `cover_notion`.

## Перед применением

### 1. Бэкап (обязательно)

```bash
# Вариант 1: bash (Git Bash / WSL)
bash scripts/create-backup-019.sh

# Вариант 2: PHP
php scripts/backup-019.php

# Вариант 3: mysqldump вручную
mysqldump -h mysql.35401aca832c.hosting.myjino.ru -P 3306 -u j35045845_biblio -p \
  --single-transaction --no-tablespaces --default-character-set=utf8mb4 \
  j35045845_biblio > backups/backup_before_migration_019_$(date +%Y%m%d_%H%M%S).sql
```

Убедитесь, что файл в `backups/` создан и не пуст.

### 2. Применение миграции

```bash
mysql -h mysql.35401aca832c.hosting.myjino.ru -P 3306 -u j35045845_biblio -p j35045845_biblio \
  < ../019_covers_short_large.sql
```

(Или через Docker / свой клиент, подставив свою БД.)

## После миграции

- Списки (index, group) используют `cover_short`, страница карточки (detail) — `cover_large`.
- Убедитесь, что по путям `.../bibliotechka/short/` и `.../bibliotechka/large/` лежат файлы `{slug}.webp`.
