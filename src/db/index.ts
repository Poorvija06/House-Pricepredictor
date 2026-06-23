import fs from 'fs';
import path from 'path';
import { ContactMessage } from '../types';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'contacts.sqlite');
const BACKUP_JSON_FILE = path.join(DB_DIR, 'contacts_backup.json');

let sqliteDb: any = null;
let isUsingSqlite = false;

// Graceful SQLite Provider
export async function initDb(): Promise<void> {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  try {
    // Attempt dynamic import of sqlite3 to prevent compiling crashes if missing
    const sqlite3Module = await import('sqlite3');
    const sqlite3 = sqlite3Module.default.verbose();

    return new Promise((resolve, reject) => {
      sqliteDb = new sqlite3.Database(DB_FILE, (err) => {
        if (err) {
          console.error('Failed to open SQLite database, falling back to JSON storage:', err.message);
          isUsingSqlite = false;
          resolve();
        } else {
          sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS contacts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              message TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `, (tableErr) => {
            if (tableErr) {
              console.error('Failed to create table in SQLite, falling back:', tableErr.message);
              isUsingSqlite = false;
            } else {
              console.log('SQLite database initialized successfully at:', DB_FILE);
              isUsingSqlite = true;
            }
            resolve();
          });
        }
      });
    });
  } catch (err: any) {
    console.warn('sqlite3 package not available or failed to load. Using robust JSON local persistence fallback.');
    isUsingSqlite = false;
    
    // Seed backup JSON if missing
    if (!fs.existsSync(BACKUP_JSON_FILE)) {
      fs.writeFileSync(BACKUP_JSON_FILE, JSON.stringify([]), 'utf8');
    }
  }
}

export async function saveContactMessage(name: string, email: string, message: string): Promise<ContactMessage> {
  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const cleanMsg = message.trim();

  if (isUsingSqlite && sqliteDb) {
    return new Promise((resolve, reject) => {
      const stmt = sqliteDb.prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)');
      stmt.run(cleanName, cleanEmail, cleanMsg, function (err) {
        if (err) {
          console.error('Error saving to SQLite, falling back to JSON save:', err.message);
          // Fallback to JSON save in case of sudden database lock
          saveToBackupJson(cleanName, cleanEmail, cleanMsg).then(resolve).catch(reject);
        } else {
          resolve({
            id: this.lastID,
            name: cleanName,
            email: cleanEmail,
            message: cleanMsg,
            createdAt: new Date().toISOString()
          });
        }
      });
      stmt.finalize();
    });
  } else {
    return saveToBackupJson(cleanName, cleanEmail, cleanMsg);
  }
}

async function saveToBackupJson(name: string, email: string, message: string): Promise<ContactMessage> {
  try {
    let items: ContactMessage[] = [];
    if (fs.existsSync(BACKUP_JSON_FILE)) {
      const content = fs.readFileSync(BACKUP_JSON_FILE, 'utf8');
      items = JSON.parse(content);
    }

    const newItem: ContactMessage = {
      id: items.length + 1,
      name,
      email,
      message,
      createdAt: new Date().toISOString()
    };

    items.push(newItem);
    fs.writeFileSync(BACKUP_JSON_FILE, JSON.stringify(items, null, 2), 'utf8');
    return newItem;
  } catch (err: any) {
    console.error('Critically failed to write backup JSON:', err.message);
    return { name, email, message, createdAt: new Date().toISOString() };
  }
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  if (isUsingSqlite && sqliteDb) {
    return new Promise((resolve) => {
      sqliteDb.all('SELECT * FROM contacts ORDER BY id DESC', (err, rows: any[]) => {
        if (err) {
          console.error('Error fetching from SQLite, pulling from JSON backup:', err.message);
          resolve(getBackupJsonMessages());
        } else {
          const mapped = rows.map(r => ({
            id: r.id,
            name: r.name,
            email: r.email,
            message: r.message,
            createdAt: r.created_at
          }));
          resolve(mapped);
        }
      });
    });
  } else {
    return getBackupJsonMessages();
  }
}

function getBackupJsonMessages(): ContactMessage[] {
  try {
    if (fs.existsSync(BACKUP_JSON_FILE)) {
      const content = fs.readFileSync(BACKUP_JSON_FILE, 'utf8');
      const items = JSON.parse(content) as ContactMessage[];
      return items.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
  } catch (e) {
    console.error('Error reading JSON backup:', e);
  }
  return [];
}

export async function getContactStats(): Promise<{ totalCount: number; isSqlite: boolean; dbPath: string }> {
  const messages = await getContactMessages();
  return {
    totalCount: messages.length,
    isSqlite: isUsingSqlite,
    dbPath: isUsingSqlite ? DB_FILE : BACKUP_JSON_FILE
  };
}
