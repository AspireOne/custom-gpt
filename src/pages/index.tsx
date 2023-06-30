import {signIn, useSession} from "next-auth/react";
import Head from "next/head";
import useLLM, {OpenAIMessage} from "usellm";
import React, {useEffect, useMemo, useState} from "react";
import useChat from "~/hooks/useChat";
import {notifications} from "@mantine/notifications";
import SignInModal from "~/components/SignInModal";
import ChatUi from "~/components/ChatUi";
import useKeyboardShortcuts from "~/hooks/useKeyboardShortcuts";
import {ChatLs, LsSavedChat} from "~/utils/LocalStorage";
import {AiOutlinePlus} from "react-icons/ai";

export type KeyboardShortcut = {
    key: string;
    description: string;
    function: () => void;
}

let shouldStopStreaming: boolean = false;

export default function Index() {
    const [streaming, setStreaming] = useState(false);
    const chat = useChat([]);
    const {status} = useSession();
    const llm = useLLM({serviceUrl: "/api/chat/response"});
    const keyboardShortcuts = useMemo<KeyboardShortcut[]>(() => [
        {
            key: "D",
            description: "Start new chat",
            function: () => startNewChat(chat),
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
            <div className={"relative min-h-[100dvh] flex flex-row"}>
                <ChatHistoryPanel
                    className={"w-[200px] h-full p-4 "
                        + "fixed top-0 bottom-0 left-0 w-full h-full hidden sm:block"}
                    selectedId={chat.id}
                    chats={chat.chatHistory}
                    onNewChat={() => startNewChat(chat)}
                    onClick={chat.load}/>

                <ChatUi
                    onStopStreaming={() => stopStreaming(streaming)}
                    keyboardShortcuts={keyboardShortcuts}
                    messages={chat.messages}
                    loading={streaming}
                    onSend={onSend}
                    className={"min-h-[100dvh] sm:ml-[190px] sm:px-14 md:px-20 w-full max-h-full p-4 rounded-lg"}/>
            </div>
        </>
    );
};

function ChatHistoryPanel(props: {
    onClick?: (id: string | number) => void,
    chats: LsSavedChat[],
    selectedId?: string | number,
    className?: string,
    onNewChat?: () => void,
}) {

    return (
        <div className={props.className}>
            <h2 className={"text-2xl font-bold mb-6"}>
                Chat History
            </h2>

            <div className={"flex flex-col mt-4 h-full overflow-y-auto"}>
                <>
                    <AiOutlinePlus
                        className={"mx-auto mb-4 hover:cursor-pointer"}
                        size={"25px"}
                        onClick={props.onNewChat}/>
                    {
                        Object.entries(props.chats).reverse().map(([id, chat], index) => (
                            <button
                                key={index}
                                onClick={() => props.onClick?.(chat.id)}
                                className={(
                                        props.selectedId === chat.id ? "bg-gray-200/30 " : "bg-gray-200/10 ")
                                    + "w-full p-2 mb-2 rounded-lg hover:bg-gray-200/20 text-left"}>
                            <span className={"text-sm font-bold"}>
                                {
                                    chat.messages?.length > 0
                                        ? `${chat.messages[0]!.content.slice(0, 30)}...`
                                        : "Empty chat"
                                }
                            </span>
                            </button>
                        ))
                    }
                </>
            </div>
        </div>
    );
}

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


function startNewChat(chat: ReturnType<typeof useChat>) {
    if (chat.messages.length === 0) {
        showChatEmptyNotification();
        return;
    }
    chat.startNew();
    notifications.show({
        title: "Switched to a new chat",
        message: "",
        color: "green",
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