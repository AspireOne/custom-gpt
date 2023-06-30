import {Message} from "~/server/ChatUtils";
import React, {PropsWithChildren, useState} from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark, atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import {FiCopy} from "react-icons/fi";
import {Tooltip} from "@mantine/core";
const curStyle = atomDark;

type ContentType = "code" | "bold" | "text";
type Markdown = {
 content: string;
 type: ContentType;
 language?: string;
}

export default function ChatMessage(props: { message: Message, key: string | number }) {
    const message = props.message;
    if (message.role === "system") return null;

    const markdown = breakDownToMarkdown(message.content);
    const getRoleNickname = (role: "user" | "assistant") => role == "user" ? "You" : "Drak Šmak";

    return (
        <div key={props.key} className={"flex flex-row gap-2 py-6 rounded whitespace-pre-line " +
            (message.role === "assistant" && "bg-zinc-500/20 shadow px-6")}>
            <div className={"flex flex-col gap-1"}>
                <p className={"font-bold"}>
                    {getRoleNickname(message.role)}
                </p>
                <div>
                    {
                        markdown.map((markdown, i) => {
                            switch (markdown.type) {
                                case "code":
                                    return (
                                        <Code key={i} language={markdown.language}>
                                            {markdown.content}
                                        </Code>)
                                case "bold":
                                    return <b key={i}>{markdown.content}</b>;
                                default:
                                    return <span key={i}>{markdown.content}</span>;
                            }
                        })
                    }
                </div>
            </div>
        </div>
    )
}

function Code(props: {language?: string, key?: string | number, children: string}) {
    return (
        <div className={"relative"}>
            <CopyButton onClick={() => navigator.clipboard.writeText(props.children)}/>
            <SyntaxHighlighter
                language={props.language}
                style={curStyle}
                wrapLongLines={true}
                key={props.key}>
                {props.children}
            </SyntaxHighlighter>
        </div>
    )
}

function CopyButton(props: PropsWithChildren<{ onClick: () => void }>) {
    const [animating, setAnimating] = useState(false);
    function onClick() {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 1000);
        props.onClick();
    }
    return (
        <Tooltip label={animating ? "Copied!" : "Copy"} >
            <button
                className={"absolute right-4 top-4"}
                onClick={onClick}>
                <FiCopy size={"20px"} className={animating ? "flash-green" : ""} />
            </button>
        </Tooltip>
    )
}

function breakDownToMarkdown(text: string): Markdown[] {
    // Append triple backticks to the end of the text if there is an odd number of them.
    if ((text.match(/```/g) || []).length % 2 !== 0) {
        text += "```";
    }

    // Iterate through the content and break it down into parts of code, normal text, and bold text based on backticks.
    function changeState(newState: ContentType, language: string | null = null) {
        if (state === newState) return;
        markdown.push({content: currStr, type: state, language: language ?? undefined});
        currStr = "";
        state = newState;
    }

    const markdown: Markdown[] = [];
    let state: ContentType = "text";
    let currStr = "";
    let currLang: string | null = null;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char !== "`") {
            currStr += char;
            continue;
        }

        // If beginning or end of code block.
        if (text[i+1] === "`" && text[i+2] === "`") {
            if ((state as ContentType) === "code") {
                changeState("text", currLang);
                currLang = null;
                i += 2;
            } else {
                // Get all text until next newline, and count characters.
                let language = "";

                // get text after the three backticks.
                let j = 3;
                while (text[i+j] !== "\n" && i+j < text.length - 1) {
                    language += text[i+j];
                    j++;
                }

                i += (3 + language.length);
                currLang = language;
                changeState("code");
            }
            continue;
        }

        // Beginning or end of bold text.
        if ((state as ContentType) !== "code") {
            changeState((state as ContentType) === "bold" ? "text" : "bold");
            continue;
        }
    }

    if (currStr.length > 0) {
        markdown.push({content: currStr, type: state});
    }

    return markdown;
}

function DangerousHtml(props: { children: string, className?: string }) {
    return <p className={props.className} dangerouslySetInnerHTML={{__html: props.children}}/>
}