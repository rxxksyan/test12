import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';

const USERS_FILE = path.join(__dirname, '../../users.json');

export interface LikedTag {
  tag: string;
  timestamp: number;
}

export interface User {
  id: string;
  nickname: string;
  email: string;
  phone?: string;
  passwordHash: string;
  createdAt: string;
  role?: 'user' | 'admin' | 'owner';
  likedTags?: LikedTag[];
  likedProductIds?: number[];
}

export async function readUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err: unknown) {
    return [];
  }
}

export async function writeUsers(users: User[]): Promise<void> {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await readUsers();
  return users.find(u => u.email === email);
}

export async function findUserByNickname(nickname: string): Promise<User | undefined> {
  const users = await readUsers();
  return users.find(u => u.nickname === nickname);
}

export async function createUser(nickname: string, email: string, password: string, phone?: string): Promise<User> {
  const users = await readUsers();
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: Date.now().toString(),
    nickname,
    email,
    phone,
    passwordHash,
    createdAt: new Date().toISOString(),
    role: 'user',
    likedTags: []
  };
  users.push(newUser);
  await writeUsers(users);
  return newUser;
}

export async function addLikedTags(userId: string, tags: string[]): Promise<void> {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;
  if (!user.likedTags) { user.likedTags = []; }
  const now = Date.now();
  for (const tag of tags) {
    const existing = user.likedTags.find(lt => lt.tag === tag);
    if (existing) { existing.timestamp = now; }
    else { user.likedTags.push({ tag, timestamp: now }); }
  }
  await writeUsers(users);
}

export async function getUserLikedTags(userId: string): Promise<string[]> {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  if (!user || !user.likedTags) return [];
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  return user.likedTags
    .filter(lt => lt.timestamp > threeDaysAgo)
    .map(lt => lt.tag);
}

export async function hasLikedProduct(userId: string, productId: number): Promise<boolean> {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  if (!user || !user.likedProductIds) return false;
  return user.likedProductIds.includes(productId);
}

export async function addLikedProduct(userId: string, productId: number): Promise<void> {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;
  if (!user.likedProductIds) user.likedProductIds = [];
  if (!user.likedProductIds.includes(productId)) {
    user.likedProductIds.push(productId);
    await writeUsers(users);
  }
}

export async function getUserLikedProductIds(userId: string): Promise<number[]> {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  if (!user || !user.likedProductIds) return [];
  return user.likedProductIds;
}
