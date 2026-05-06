import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'knowledge_arena.db');

let _db: Database.Database | null = null;

function db(): Database.Database {
  if (!_db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    migrate(_db);
  }
  return _db;
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT 'violet',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT,
      content TEXT NOT NULL,
      char_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

export interface Source {
  id: string;
  topic_id: string;
  type: 'url' | 'file';
  name: string;
  url: string | null;
  content: string;
  char_count: number;
  created_at: string;
}

export type SourceMeta = Omit<Source, 'content'>;

export function getTopics(): Topic[] {
  return db().prepare('SELECT * FROM topics ORDER BY created_at DESC').all() as Topic[];
}

export function getTopicById(id: string): Topic | null {
  return db().prepare('SELECT * FROM topics WHERE id = ?').get(id) as Topic | null;
}

export function createTopic(topic: Omit<Topic, 'created_at'>): void {
  db()
    .prepare(
      'INSERT INTO topics (id, name, description, color, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .run(topic.id, topic.name, topic.description, topic.color, new Date().toISOString());
}

export function deleteTopic(id: string): void {
  db().prepare('DELETE FROM topics WHERE id = ?').run(id);
}

export function getSourcesMeta(topicId: string): SourceMeta[] {
  return db()
    .prepare(
      'SELECT id, topic_id, type, name, url, char_count, created_at FROM sources WHERE topic_id = ? ORDER BY created_at DESC'
    )
    .all(topicId) as SourceMeta[];
}

export function getSourcesContent(topicId: string): string {
  const rows = db()
    .prepare('SELECT name, content FROM sources WHERE topic_id = ? ORDER BY created_at ASC')
    .all(topicId) as { name: string; content: string }[];

  return rows.map(r => `=== Source: ${r.name} ===\n${r.content}`).join('\n\n---\n\n');
}

export function createSource(source: Omit<Source, 'created_at'>): void {
  db()
    .prepare(
      'INSERT INTO sources (id, topic_id, type, name, url, content, char_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      source.id,
      source.topic_id,
      source.type,
      source.name,
      source.url ?? null,
      source.content,
      source.char_count,
      new Date().toISOString()
    );
}

export function deleteSource(id: string): void {
  db().prepare('DELETE FROM sources WHERE id = ?').run(id);
}
