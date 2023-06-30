import {Message} from "~/server/ChatUtils";
import React, {useEffect, useState} from "react";
import TextareaAutosize from "react-textarea-autosize";
import {FaPaperPlane} from "react-icons/fa";
import ChatMessage from "~/components/ChatMessage";
import {KeyboardShortcut} from "~/pages";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export default function ChatUi(props: {
    messages: Message[],
    className?: string,
    onSend: (message: string) => void,
    keyboardShortcuts: KeyboardShortcut[],
    loading?: boolean,
    onStopStreaming: () => void,
}) {
    const lastMsgRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const posY = window.scrollY;
        const maxY = document.body.scrollHeight - window.innerHeight;

        if (maxY - posY < 250) {
            lastMsgRef.current?.scrollIntoView({behavior: "smooth"});
        }
    }, [props.messages]);

    return (
        <div className={props.className}>
            {
                props.messages.length === 0 &&
                <div className={"flex flex-col gap-12 mt-4 justify-center items-center mx-auto"}>
                    <h1 className={"text-2xl text-pink-300 font-semibold"}>
                        GPT 3.5 16K Context Model
                    </h1>
                    <KeyboardShortcutsOverview shortcuts={props.keyboardShortcuts}/>
                </div>
            }
            {
                props.messages.length > 0 &&
                <div className={"flex flex-col gap-2 text-gray-100 sm:px-24 lg:px-36 pb-36"}>
                    {props.messages.map((message, index) => <ChatMessage message={message} key={index}/>)}
                    <div ref={lastMsgRef}/>
                </div>
            }

            <div className={"fixed bottom-0 left-0 right-0"}>
                {
                    props.loading &&
                    <div className={"w-full flex items-center justify-center"}>
                        <button
                            onClick={props.onStopStreaming}
                            className={"mx-auto border border-gray-600 text-gray-400 " +
                            "rounded p-3 duration-75 hover:bg-zinc-800"}>
                            Stop generating
                        </button>
                    </div>
                }
                <ChatInputBox
                    onSend={props.onSend}
                    loading={props.loading}
                    className={""}/>
            </div>
        </div>
    )
}

function KeyboardShortcutsOverview(props: { className?: string, shortcuts: KeyboardShortcut[] }) {
    return (
        <div className={"flex flex-col gap-2 " + props.className}>
            <h2 className={"font-bold text-lg"}>Keyboard Shortcuts</h2>
            <div className={"flex flex-col gap-1"}>
                {props.shortcuts.map(shortcut => (
                    <div className={"flex flex-row gap-2"} key={shortcut.key}>
                        <kbd className={"bg-gray-500/30 rounded px-1"}>ctrl+{shortcut.key}</kbd>
                        <p>{shortcut.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ChatInputBox(props: {
    onSend: (message: string) => void,
    loading?: boolean,
    className?: string
}) {
    const [message, setMessage] = useState("");
    const [isMobile, setIsMobile] = useState(false);
    const textboxRef = React.useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // is mobile.
        const handler = () => setIsMobile(window.innerWidth <= 700);
        setIsMobile(window.innerWidth <= 700);
        addEventListener("resize", handler);
        return removeEventListener("resize", handler);
    }, []);

    async function sendMessage() {
        if (message.trim().length === 0 || props.loading) return;
        setMessage("");
        props.onSend(message);
    }

    async function handleKeyDown(e: any) {
        if (e.key === "Enter" && !e.shiftKey && !props.loading && window.innerWidth > 700) {
            await sendMessage();
            e.preventDefault();
        }
    }

    return (
        <div className={`bg-[#1a1b1e] px-4 sm:px-40 pb-4 pt-4 flex flex-row gap-2 ` + props.className}>
            <TextareaAutosize ref={textboxRef}
                              onKeyDown={handleKeyDown}
                              onChange={e => setMessage(e.currentTarget.value)}
                              value={message}
                              placeholder={"How can I help?"}
                              minRows={2}
                              className={`max-h-[30dvh] overflow-y-auto overflow-hidden flex-grow rounded p-4 bg-zinc-700 shadow ` +
                                  `border-none outline-none resize-none ${props.loading ? "text-gray-400" : "text-gray-300"}`}/>

            {
                isMobile &&
                <button
                    disabled={props.loading}
                    onClick={sendMessage}>
                    <FaPaperPlane
                        size={"32px"}
                        className={`transition hover:ease-in-out hover:scale-110 hover:text-blue-400` +
                            `"w-full ${props.loading && "text-gray-500"}`}
                    />
                </button>
            }
        </div>
    )
}