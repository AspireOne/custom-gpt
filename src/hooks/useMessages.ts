// useMessages.ts.

import {useState} from "react";

export type LocalMessage = {
    content: string,
    role: "assistant" | "user",
    status: "loading" | "failed" | "resolved"
}

export default function useMessages() {
    const [messages, setMessages] = useState<LocalMessage[]>([]);
    const [loading, setLoading] = useState(false);

    function setLastMessageStatus(status: "loading" | "failed" | "resolved") {
        setMessages(messages => {
            const lastMessage = messages[messages.length - 1]!;
            return messages
                .slice(0, messages.length - 1)
                .concat([{...lastMessage, status}]);
        });
    }

    function addUserMessage(message: LocalMessage) {
        setMessages(messages => messages.concat([message]));
    }

    function addAssistantMessage(message: string) {
        setMessages(messages => messages.concat([{
            role: "assistant",
            content: message,
            status: "resolved"
        }]));
    }

    return {
        messages,
        addUserMessage,
        setLastMessageStatus,
        loading,
        setLoading,
        addAssistantMessage
    }
}