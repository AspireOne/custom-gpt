import {signIn, useSession} from "next-auth/react";
import Head from "next/head";
import useLLM, {OpenAIMessage} from "usellm";
import React, {useEffect, useMemo, useState} from "react";
import useChat from "~/hooks/useChat";
import {notifications} from "@mantine/notifications";
import SignInModal from "~/components/SignInModal";
import ChatUi from "~/components/ChatUi";
import useKeyboardShortcuts from "~/hooks/useKeyboardShortcuts";

export type KeyboardShortcut = {
    key: string;
    description: string;
    function: () => void;
}

let shouldStopStreaming: boolean = false;

export default function Chat() {
    const [streaming, setStreaming] = useState(false);
    const chat = useChat([]);
    const {status} = useSession();
    const llm = useLLM({serviceUrl: "/api/chat/response"});
    const keyboardShortcuts = useMemo<KeyboardShortcut[]>(() => [
        {
            key: "D",
            description: "Clear messages",
            function: () => clearMessages(chat),
        },
        {
            key: "S",
            description: "Delete last message",
            function: () => deleteLastMessage(chat)
        },
        {
            key: "R",
            description: "Stop streaming",
            function: () => stopStreaming(streaming)
        }
    ], [chat]);

    useKeyboardShortcuts(keyboardShortcuts, []);

    async function onSend(message: string) {
        setStreaming(true);
        await startStreaming(chat, llm, message);
        setStreaming(false);
    }

    return (
        <>
            <Head>
                <title>GPT Custom Model Chat</title>
                <meta name="description" content="Custom GPT chat interface for testing out models."/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>

            {status === "unauthenticated" && <SignInModal/>}
            <div className={"min-h-[100dvh]"}>
                <ChatUi
                    onStopStreaming={() => stopStreaming(streaming)}
                    keyboardShortcuts={keyboardShortcuts}
                    messages={chat.messages}
                    loading={streaming}
                    onSend={onSend}
                    className={"min-h-[100dvh] max-h-full p-4 rounded-lg"}/>
            </div>
        </>
    );
};

async function startStreaming(chat: ReturnType<typeof useChat>, llm: ReturnType<typeof useLLM>, message: string) {
    const messages = chat.push({role: "user", content: message});

    function handleChunkReceived(props: { message: OpenAIMessage, isFirst: boolean, isLast: boolean }) {
        const {message, isFirst, isLast} = props;

        if (shouldStopStreaming) {
            shouldStopStreaming = false;
            throw new Error("Stop streaming");
        }

        isFirst
            ? chat.push({role: "assistant", content: message.content})
            : chat.replaceLastMessage({role: "assistant", content: message.content});
    }

    try {
        return await llm.chat({
            template: "gpt-3.5-16k",
            messages: messages,
            stream: true,
            onStream: handleChunkReceived,
        });

    } catch (error: any) {
        if (error?.message === "Stop streaming") return;
        notifications.show({
            title: "Error",
            message: "Something went wrong while sending your message. Err: " + error,
            color: "red",
        });
        chat.pop();
        console.error("Something went wrong!", error);
    }
}

function stopStreaming(streaming: boolean) {
    if (!streaming) {
        notifications.show({
            title: "Not streaming",
            message: "There is no streaming to stop.",
            color: "orange",
        });
        return;
    }
    shouldStopStreaming = true;
}


function clearMessages(chat: ReturnType<typeof useChat>) {
    if (chat.messages.length === 0) {
        showChatEmptyNotification();
        return;
    }
    chat.clear();
    notifications.show({
        title: "Chat cleared",
        message: "Chat has been cleared.",
        color: "blue",
    });
}

function deleteLastMessage(chat: ReturnType<typeof useChat>) {
    if (chat.messages.length === 0) {
        showChatEmptyNotification();
        return;
    }
    chat.pop();
    notifications.show({
        title: "Last message deleted",
        message: "Last message has been deleted.",
        color: "blue",
    })
}

function showChatEmptyNotification() {
    notifications.show({
        title: "Chat is empty",
        message: "Chat is empty. Type something to get started.",
        color: "orange",
    });
}