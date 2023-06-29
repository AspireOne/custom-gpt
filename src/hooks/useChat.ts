import {Message} from "~/server/ChatUtils";
import {useEffect, useState} from "react";
import {useSetState} from "@mantine/hooks";

export default function useChat(initialMessages: Message[] = []) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);

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
    };
}