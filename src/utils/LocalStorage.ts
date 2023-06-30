// LocalStorage abstraction.

import {Message} from "~/server/ChatUtils";

export enum LsKey {
    Chat = 'chat',
}

export type LsSavedChat = {
    id: string | number;
    messages: Message[];
}

export class Ls {
    public static get(key: LsKey): any {
        return localStorage.getItem(key);
    }

    public static set(key: LsKey, value: any): void {
        localStorage.setItem(key, value);
    }

    public static remove(key: LsKey): void {
        localStorage.removeItem(key);
    }

    public static clear(): void {
        localStorage.clear();
    }
}

export class ChatLs {
    public static getAll(excludeEmpty: boolean = true): LsSavedChat[] {
        let chats = JSON.parse(Ls.get(LsKey.Chat));
        chats = chats || [];
        if (excludeEmpty && chats.length > 0) {
            // @ts-ignore
            chats = chats.filter((c) => c.messages.length > 0);
        }
        return chats;
    }

    public static get(id: string | number) {
        const chats = this.getAll();
        return chats.find((c) => c.id === id);
    }

    public static set(chat: LsSavedChat): void {
        const currChats = this.getAll();

        // if already contains chat with the same id, overwrite it
        const index = currChats.findIndex((c) => c.id === chat.id);
        if (index !== -1) {
            currChats[index] = chat;
        }
        else {
            currChats.push(chat);
        }

        Ls.set(LsKey.Chat, JSON.stringify(currChats));
    }

    public static removeAll(): void {
        Ls.remove(LsKey.Chat);
    }

    public static remove(id: string | number): void {
        const chats = this.getAll();
        const index = chats.findIndex((c) => c.id === id);
        if (index !== -1) {
            chats.splice(index, 1);
            Ls.set(LsKey.Chat, JSON.stringify(chats));
        } else {
            console.warn(`Chat with id ${id} not found in local storage.`);
        }
    }
}