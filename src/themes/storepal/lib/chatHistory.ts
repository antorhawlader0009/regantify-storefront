import type { ChatProductRef } from '@/lib/chatApi';
import type { ChatOrder } from '@/lib/chatOrder';

/**
 * The store chat's saved conversations (AiAssistantWidget.tsx), like the dashboard's Ask AI: the server keeps no chats,
 * the last MAX_CHATS of each store are kept in this browser's localStorage, and the chat in use plus whether the panel
 * is open are kept per tab (sessionStorage), so opening a product page never loses the conversation. Only what the
 * shopper saw is kept: messages, product cards, the order being taken, and a small thumbnail of a photo they sent.
 * Every read and write is guarded: blocked storage just means nothing is remembered.
 */

export interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: ChatProductRef[];
  image?: string;
  picks?: string[];
  complaint?: { contactPage: boolean };
  at?: number;
}

export interface StoredChat {
  id: string;
  title: string;
  updatedAt: number;
  messages: StoredMessage[];
  order: ChatOrder | null;
}

const MAX_CHATS = 10;
const MAX_MESSAGES = 60;

const chatsKey = (sub: string) => `storepal-chats:${sub}`;
const currentKey = (sub: string) => `storepal-chat-current:${sub}`;
const openKey = (sub: string) => `storepal-chat-open:${sub}`;

export function newChatId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function loadChats(sub: string): StoredChat[] {
  try {
    const raw = JSON.parse(localStorage.getItem(chatsKey(sub)) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((c): c is StoredChat => !!c && typeof c.id === 'string' && Array.isArray(c.messages))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_CHATS);
  } catch {
    return [];
  }
}

function writeChats(sub: string, chats: StoredChat[]) {
  let list = chats.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CHATS);
  // Storage full (thumbnails add up): drop the oldest chats until it fits.
  while (list.length) {
    try {
      localStorage.setItem(chatsKey(sub), JSON.stringify(list));
      return;
    } catch {
      list = list.slice(0, -1);
    }
  }
  try {
    localStorage.removeItem(chatsKey(sub));
  } catch {
    // blocked
  }
}

/** Saves (or updates) one chat; a chat with no shopper message yet is not saved. */
export function saveChat(sub: string, chat: Omit<StoredChat, 'title'>) {
  const firstUser = chat.messages.find((m) => m.role === 'user');
  if (!firstUser) return;
  const title = (firstUser.content || (firstUser.image ? 'Photo' : 'Chat')).slice(0, 60);
  const messages = chat.messages.slice(-MAX_MESSAGES);
  writeChats(sub, [{ ...chat, title, messages }, ...loadChats(sub).filter((c) => c.id !== chat.id)]);
}

export function deleteChat(sub: string, id: string) {
  writeChats(sub, loadChats(sub).filter((c) => c.id !== id));
}

function session(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setSession(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // blocked
  }
}

export const currentChatId = (sub: string) => session(currentKey(sub));
export const setCurrentChatId = (sub: string, id: string | null) => setSession(currentKey(sub), id);
export const wasOpen = (sub: string) => session(openKey(sub)) === '1';
export const rememberOpen = (sub: string, open: boolean) => setSession(openKey(sub), open ? '1' : null);

/** A small JPEG thumbnail of the shopper's photo (about 5 KB), so it can be kept with the chat. */
export async function photoThumbnail(file: File, side = 160): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  }
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.7);
}

/** "now", "5m", "3h", "2d", like the dashboard's chat list. */
export function ago(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
