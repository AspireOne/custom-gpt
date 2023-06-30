import {Message} from "~/server/ChatUtils";
import {useEffect, useState} from "react";
import {useSetState} from "@mantine/hooks";
import {ChatLs, LsSavedChat} from "~/utils/LocalStorage";

function genRandomId(): string {
    return Math.random().toString(36).substring(2, 10);
}

export default function useChat(initialMessages: Message[] = [], autosave: boolean = true, ) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [id, setId] = useState<string | number>(genRandomId());
    const [chatHistory, setChatHistory] = useSetState<LsSavedChat[]>([]);

    useEffect(() => {
        if (autosave) save();
    }, [messages]);

    useEffect(() => {
        setChatHistory(ChatLs.getAll());
    }, []);

    function push(message: Message): Message[] {
        setMessages((messages) => messages.concat([message]));
        return messages.concat([message]);
    }

    function pop() {
        setMessages((messages) => {
            return messages.slice(0, messages.length - 1);
        });
    }

    function clear() {
        setMessages([]);
    }

    function startNewChat(messages?: Message[]) {
        setMessages(messages || []);
        setId(genRandomId());
        save();
    }

    function loadChat(id: string | number): boolean {
        const chat = ChatLs.get(id);
        if (chat) {
            setMessages(chat.messages);
            setId(chat.id);
        }

        return !!chat;
    }

    function save() {
        /*if (messages.length === 0) return;*/
        ChatLs.set({id, messages});
        setChatHistory(ChatLs.getAll());
    }

    function replaceLastMessage(message: Message) {
        setMessages((messages) => {
            return messages.slice(0, messages.length - 1).concat([message]);
        });
    }

    return {
        messages,
        push,
        pop,
        replaceLastMessage,
        clear,
        startNew: startNewChat,
        save,
        load: loadChat,
        id,
        chatHistory,
    };
}