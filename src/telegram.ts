// Minimal typed wrapper over the Telegram Bot API (free; https://core.telegram.org/bots/api).
// Only the surface this bot needs.

export interface TgUser {
  id: number;
}

export interface TgPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TgMessage {
  message_id: number;
  from?: TgUser;
  chat: { id: number };
  text?: string;
  caption?: string;
  photo?: TgPhotoSize[];
}

export interface TgCallbackQuery {
  id: string;
  from: TgUser;
  data?: string;
  message?: TgMessage;
}

export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
}

export interface InlineButton {
  text: string;
  callback_data: string;
}

export class Telegram {
  constructor(private readonly token: string) {}

  private async call<T>(method: string, body: unknown): Promise<T> {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as T;
  }

  sendMessage(chatId: number, text: string, buttons?: InlineButton[][]): Promise<unknown> {
    return this.call("sendMessage", {
      chat_id: chatId,
      text,
      ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
    });
  }

  answerCallbackQuery(id: string): Promise<unknown> {
    return this.call("answerCallbackQuery", { callback_query_id: id });
  }

  /** Resolve a photo file_id to a temporary download URL, then fetch its bytes. */
  async downloadFile(fileId: string): Promise<ArrayBuffer | null> {
    const res = await this.call<{ ok: boolean; result?: { file_path?: string } }>("getFile", {
      file_id: fileId,
    });
    const path = res.result?.file_path;
    if (!res.ok || !path) return null;
    const fileRes = await fetch(`https://api.telegram.org/file/bot${this.token}/${path}`);
    if (!fileRes.ok) return null;
    return fileRes.arrayBuffer();
  }
}

/** Base64-encode an ArrayBuffer (Workers-safe, no Node Buffer needed). */
export function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
