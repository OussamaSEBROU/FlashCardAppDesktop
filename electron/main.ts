import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;

// Initialize Database
const dbPath = path.join(app.getPath('userData'), 'flashcards.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    set_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    language TEXT DEFAULT 'en'
  );
  CREATE TABLE IF NOT EXISTS quiz_questions (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON string
    correct_option_indices TEXT NOT NULL, -- JSON string
    set_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS quiz_sets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    time_limit INTEGER DEFAULT 0,
    allowed_retries INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    width: 1200,
    height: 800,
    backgroundColor: '#000000',
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

// IPC Handlers for Flashcards
ipcMain.handle('get-flashcards', async () => {
  return db.prepare('SELECT * FROM flashcards ORDER BY created_at DESC').all();
});

ipcMain.handle('add-flashcard', async (_event, card) => {
  const stmt = db.prepare('INSERT INTO flashcards (id, question, answer, set_id) VALUES (?, ?, ?, ?)');
  return stmt.run(card.id, card.question, card.answer, card.set_id);
});

ipcMain.handle('delete-flashcard', async (_event, id) => {
  const stmt = db.prepare('DELETE FROM flashcards WHERE id = ?');
  return stmt.run(id);
});

ipcMain.handle('update-flashcard', async (_event, card) => {
  const stmt = db.prepare('UPDATE flashcards SET question = ?, answer = ? WHERE id = ?');
  return stmt.run(card.question, card.answer, card.id);
});

ipcMain.handle('get-sets', async () => {
  return db.prepare('SELECT * FROM sets').all();
});

ipcMain.handle('add-set', async (_event, set) => {
  const stmt = db.prepare('INSERT INTO sets (id, title, description, language) VALUES (?, ?, ?, ?)');
  return stmt.run(set.id, set.title, set.description, set.language);
});

// IPC Handlers for Quizzes
ipcMain.handle('get-quizzes', async () => {
  return db.prepare('SELECT * FROM quiz_sets ORDER BY created_at DESC').all();
});

ipcMain.handle('get-quiz-questions', async () => {
  return db.prepare('SELECT * FROM quiz_questions ORDER BY created_at DESC').all();
});

ipcMain.handle('add-quiz-set', async (_event, set) => {
  const stmt = db.prepare('INSERT INTO quiz_sets (id, title, time_limit, allowed_retries) VALUES (?, ?, ?, ?)');
  return stmt.run(set.id, set.title, set.timeLimit || 0, set.allowedRetries || 0);
});

ipcMain.handle('add-quiz-question', async (_event, q) => {
  const stmt = db.prepare('INSERT INTO quiz_questions (id, question, options, correct_option_indices, set_id) VALUES (?, ?, ?, ?, ?)');
  return stmt.run(q.id, q.question, JSON.stringify(q.options), JSON.stringify(q.correctOptionIndices), q.set_id);
});

ipcMain.handle('delete-quiz-set', async (_event, id) => {
  db.prepare('DELETE FROM quiz_questions WHERE set_id = ?').run(id);
  return db.prepare('DELETE FROM quiz_sets WHERE id = ?').run(id);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
