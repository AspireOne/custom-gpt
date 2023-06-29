import {signIn, useSession} from "next-auth/react";
import Head from "next/head";
import {Modal, Textarea, Tooltip, useMantineTheme} from "@mantine/core";
import {FcGoogle} from "react-icons/fc";
import useLLM, {OpenAIMessage} from "usellm";
import React, {useEffect, useState} from "react";
import {Message} from "~/server/ChatUtils";
import useLocalChat from "~/hooks/useLocalChat";
import {FaPaperPlane} from "react-icons/fa";
import {MdDelete} from "react-icons/md";
import TextareaAutosize from 'react-textarea-autosize';
import {notifications} from "@mantine/notifications";

export default function NormalChat() {
    const [streaming, setStreaming] = useState(false);
    const chat = useLocalChat([]);
    const {data, status} = useSession();
    const llm = useLLM({ serviceUrl: "/api/chat/normal" });

    async function getResponse(message: string) {
        setStreaming(true);
        const messages = chat.push({role: "user", content: message});

        function handleChunkReceived(props: { message: OpenAIMessage, isFirst: boolean, isLast: boolean }) {
            const { message, isFirst, isLast } = props;

            if (isFirst) {
                chat.push({role: "assistant", content: message.content})
                return;
            }
            if (isLast) {
                finalContent = message.content;
            }
            chat.replaceLastMessage({role: "assistant", content: message.content});
        }

        let finalContent = "";
        try {
            await llm.chat({
                template: "longpt",
                messages: messages,
                stream: true,
                onStream: handleChunkReceived,
            });
        } catch (error) {
            notifications.show({
                title: "Error",
                message: "Something went wrong while sending your message. Err: " + error,
                color: "red",
            });
            chat.pop();
            console.error("Something went wrong!", error);
        } finally {
            setStreaming(false);
        }
    }

    function clearMessages() {
        if (chat.messages.length === 0) {
            notifications.show({
                title: "Chat is empty",
                message: "Chat is already empty.",
                color: "blue",
            });
            return;
        }
        chat.clear();
        notifications.show({
            title: "Chat cleared",
            message: "Chat has been cleared.",
            color: "blue",
            icon: <MdDelete/>,
        });
    }

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "d") {
                clearMessages();
                e.preventDefault();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    });

    // global shortcut to delete last message.
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "s") {
                chat.pop();
                e.preventDefault();
                notifications.show({
                    title: "Last message deleted",
                    message: "Last message has been deleted.",
                    color: "blue",
                })
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    });

    return (
        <>
            <Head>
                <title>GPT Chat</title>
                <meta name="description" content="Custom GPT chat interface for testing out models."/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>

            {status === "unauthenticated" && <SignInModal/>}
            <div className={"h-screen sm:px-8"}>
                <ChatUi
                        onClear={clearMessages}
                        messages={chat.messages}
                        inputDisabled={streaming}
                        onSend={message => getResponse(message)}
                        className={"h-full overflow-y-auto max-h-full p-4 rounded-lg"}/>
            </div>
        </>
    );
};


function ChatUi(props: {
    messages: Message[],
    className?: string,
    onSend: (message: string) => void,
    onClear: () => void,
    inputDisabled?: boolean }) {

    useEffect(() => {
        const chatEnd = document.getElementById("chat-end");
        if (chatEnd) chatEnd.scrollIntoView({behavior: "smooth"});
    }, [props.messages]);
    return (
        <div className={"flex flex-col justify-between gap-2 " + props.className}>
            <div className={"overflow-y-auto sm:pr-6"}>
                <div className={"flex flex-col gap-2"}>
                    {props.messages.map((message: Message, index) => {
                        if (message.role === "system") return null;
                        return (
                            <div className={"flex flex-row gap-2 p-6 rounded whitespace-pre-line "
                                + (message.role === "assistant" && "bg-gray-500/20")} key={index}>
                                <div className={"flex flex-col gap-1"}>
                                    <p className={"font-bold"}>{getRoleNickname(message.role)}</p>
                                    <p>{message.content}</p>
                                </div>
                            </div>
                        )
                    })}
                    <div id={"chat-end"}></div>
                </div>
            </div>

            <ChatInput
                onClear={props.onClear}
                onSend={props.onSend}
                disabled={props.inputDisabled}
                className={"pt-4"}/>
        </div>
    )
}

function ChatInput(props: {
    onSend: (message: string) => void,
    onClear: () => void,
    disabled?: boolean,
    className?: string }) {
    // A chat input - allows the user to send messages.
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!props.disabled) {
            const input = document.getElementById("chat-input");
            if (input) input.focus();
        }
    }, [props.disabled]);

    async function sendMessage() {
        props.onSend(message);
        setMessage("");
    }

    async function handleKeyDown(e: any) {
        if (e.key === "Enter" && !e.shiftKey && !props.disabled) {
            await sendMessage();
            e.preventDefault();
        }
    }

    return (
        <div className={"flex flex-row gap-2 " + props.className}>
            <TextareaAutosize value={message}
                              id={"chat-input"}
                              disabled={props.disabled}
                              onKeyDown={handleKeyDown}
                              onChange={e => {
                                  setMessage(e.currentTarget.value);
                              }}
                              placeholder={props.disabled ? "" : "How can I help?"}
                              minRows={3}
                              className={"overflow-hidden flex-grow rounded bg-gray-500/30 p-4 border-none outline-none resize-none"}/>
            <div className={"flex flex-col justify-end gap-3 w-[40px]"}>
                <button
                    disabled={props.disabled}
                    onClick={sendMessage}
                    className={""}>
                    <FaPaperPlane
                        size={"25px"}
                        className={"w-full transition hover:ease-in-out hover:scale-110 hover:text-blue-400 " + (props.disabled && "text-gray-500")}
                    />
                </button>
                <Tooltip label={"Clear Chat | ctrl+d"}>
                    <button
                        disabled={props.disabled}
                        onClick={props.onClear}
                        className={""}>
                        <MdDelete
                            size={"30px"}
                            className={"w-full transition hover:ease-in-out hover:scale-110 hover:text-red-400"} />
                    </button>
                </Tooltip>
            </div>
        </div>
    )
}

function getRoleNickname(role: "user" | "assistant" | "system") {
    switch (role) {
        case "user":
            return "Vy";
        case "assistant":
            return "Drak Šmak";
        case "system":
            return "Systém";
    }
}

function SignInModal() {
    const theme = useMantineTheme();
    return (
        <Modal opened={true} onClose={() => {
        }} withCloseButton={false} centered
               overlayProps={{
                   color: theme.colorScheme === 'dark' ? theme.colors.dark[9] : theme.colors.gray[2],
                   opacity: 0.55,
                   blur: 3,
               }}
        >
            <p className={"text-center text-lg"}>Před pokračováním se prosím přihlašte</p>
            <button onClick={() => signIn("google")}
                    className={"px-3 py-2 bg-transparent rounded-md border border-zinc-500 " +
                        "mx-auto flex flex-row gap-4 items-center my-6"}>
                <FcGoogle size={20}/>
                <p className={"font-bold text-sm"}>Přihlásit se přes Google</p>
            </button>
        </Modal>
    )
}