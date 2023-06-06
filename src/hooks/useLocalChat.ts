import {Message} from "~/server/ChatUtils";
import {useState} from "react";

export default function useLocalChat(initialMessages: Message[] = []) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    function push(message: Message) {
        setMessages(messages => messages.concat([message]));
    }

    function replaceLastMessage(message: Message) {
        setMessages(messages => {
            const lastMessage = messages[messages.length - 1]!;
            return messages
                .slice(0, messages.length - 1)
                .concat([message]);
        });
    }

    return {
        messages,
        push,
        replaceLastMessage
    }
}