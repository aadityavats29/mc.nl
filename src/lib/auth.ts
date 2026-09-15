/**
 * Studio authentication: individual accounts, scrypt-hashed passwords,
 * server-side sessions in httpOnly cookies. Owner can publish and manage
 * access; editors prepare drafts unless granted publishing. No shared or
 * hard-coded password exists; the first account is created at /studio/setup.
 */
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import { db, now } from './db';
import type { AstroCookies } from 'astro';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'editor';
  can_publish: number;
}

const SESSION_COOKIE = 'mc_studio_session';
const SESSION_DAYS = 14;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function userCount(): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
}

export function createUser(email: string, name: string, role: 'owner' | 'editor', password: string, canPublish: boolean): User {
  const id = randomUUID();
  db.prepare(
    'INSERT INTO users(id, email, name, role, can_publish, pass_hash, created_at) VALUES(?,?,?,?,?,?,?)'
  ).run(id, email.trim().toLowerCase(), name.trim(), role, canPublish ? 1 : 0, hashPassword(password), now());
  return { id, email: email.trim().toLowerCase(), name: name.trim(), role, can_publish: canPublish ? 1 : 0 };
}

export function findUserByEmail(email: string): (User & { pass_hash: string }) | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as any;
}

export function startSession(cookies: AstroCookies, userId: string): void {
  const token = randomBytes(32).toString('hex');
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  db.prepare('INSERT INTO sessions(token, user_id, expires_at) VALUES(?,?,?)').run(token, userId, expires);
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 86400,
  });
}

export function endSession(cookies: AstroCookies): void {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function currentUser(cookies: AstroCookies): User | null {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.can_publish, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`
    )
    .get(token) as any;
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role, can_publish: row.can_publish };
}

export function canPublish(user: User): boolean {
  return user.role === 'owner' || user.can_publish === 1;
}

export function listUsers(): User[] {
  return db.prepare('SELECT id, email, name, role, can_publish FROM users ORDER BY created_at').all() as User[];
}

export function deleteUser(id: string): void {
  db.prepare("DELETE FROM users WHERE id = ? AND role != 'owner'").run(id);
}
