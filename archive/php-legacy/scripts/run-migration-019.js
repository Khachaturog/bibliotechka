#!/usr/bin/env node
/**
 * Запуск миграции 019 через Node.js
 * Использует mysql2 пакет
 * Запуск: node scripts/run-migration-019.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Настройки подключения к БД
const DB_CONFIG = {
    host: 'mysql.35401aca832c.hosting.myjino.ru',
    port: 3306,
    user: 'j35045845_biblio',
    password: 'tuhrih-zoqmYp',
    database: 'j35045845_biblio',
    charset: 'utf8mb4'
};

const BASE_DIR = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(BASE_DIR, 'backups');
const MIGRATION_FILE = path.join(BASE_DIR, 'database', 'migrations', '019_covers_short_large.sql');

async function createBackup(connection) {
    console.log('📦 Создание бэкапа...');
    
    // Создаем директорию для бэкапов
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');
    const backupFile = path.join(BACKUP_DIR, `backup_before_migration_019_${timestamp}.sql`);
    
    let sql = `-- Backup before migration 019\n`;
    sql += `-- ${new Date().toISOString()}\n\n`;
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
    
    const tables = ['groups', 'subgroups', 'versions', 'authors', 'data', 'card_authors'];
    
    for (const table of tables) {
        // Получаем CREATE TABLE
        const [createRows] = await connection.execute(`SHOW CREATE TABLE \`${table}\``);
        if (createRows.length === 0) continue;
        
        sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;
        sql += `${createRows[0]['Create Table']};\n\n`;
        
        // Получаем данные
        const [rows] = await connection.execute(`SELECT * FROM \`${table}\``);
        
        if (rows.length === 0) {
            sql += `-- Table \`${table}\`: no data\n\n`;
            continue;
        }
        
        // Получаем названия колонок
        const [columns] = await connection.execute(`DESCRIBE \`${table}\``);
        const colNames = columns.map(col => col.Field);
        const colList = '`' + colNames.join('`,`') + '`';
        
        // Формируем INSERT
        for (const row of rows) {
            const values = colNames.map(col => {
                const val = row[col];
                if (val === null) return 'NULL';
                // Экранируем специальные символы
                const escaped = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                return `'${escaped}'`;
            });
            sql += `INSERT INTO \`${table}\` (${colList}) VALUES (${values.join(',')});\n`;
        }
        
        sql += `\n`;
    }
    
    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    
    await fs.writeFile(backupFile, sql, 'utf8');
    const stats = await fs.stat(backupFile);
    console.log(`✅ Бэкап создан: ${backupFile} (${stats.size} bytes)`);
    
    return backupFile;
}

async function runMigration(connection) {
    console.log('🔄 Применение миграции...');
    
    let migrationSql = await fs.readFile(MIGRATION_FILE, 'utf8');
    
    // Удаляем комментарии (однострочные -- и многострочные /* */)
    migrationSql = migrationSql
        // Удаляем многострочные комментарии /* ... */
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Удаляем однострочные комментарии --
        .split('\n')
        .map(line => {
            const commentIndex = line.indexOf('--');
            if (commentIndex >= 0) {
                // Проверяем, что это не часть строки в кавычках
                const beforeComment = line.substring(0, commentIndex);
                const singleQuotes = (beforeComment.match(/'/g) || []).length;
                const doubleQuotes = (beforeComment.match(/"/g) || []).length;
                // Если четное количество кавычек, то комментарий валиден
                if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
                    return beforeComment;
                }
            }
            return line;
        })
        .join('\n');
    
    // Разделяем на отдельные запросы
    const queries = migrationSql
        .split(';')
        .map(q => q.trim())
        .filter(q => q && q.length > 0);
    
    try {
        for (const query of queries) {
            if (query.trim()) {
                await connection.execute(query);
            }
        }
        console.log('✅ Миграция применена успешно');
    } catch (error) {
        console.error('❌ Ошибка при применении миграции:', error.message);
        throw error;
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('Миграция 019: cover_short / cover_large');
    console.log('='.repeat(60));
    console.log();
    
    let connection;
    try {
        connection = await mysql.createConnection(DB_CONFIG);
        
        // 1. Бэкап
        const backupFile = await createBackup(connection);
        console.log();
        
        // 2. Миграция
        await runMigration(connection);
        
        console.log();
        console.log('✅ Миграция завершена успешно!');
        console.log(`📦 Бэкап сохранен: ${backupFile}`);
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

main();
