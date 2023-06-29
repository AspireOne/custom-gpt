import {Message} from "~/server/ChatUtils";
import React from "react";

export default function ChatMessage(props: { message: Message, key: string | number }) {
    const message = props.message;
    if (message.role === "system") return null;

    const markdownContent = sanitizeMarkdown(applyHtmlMarkdown(message.content));
    const getRoleNickname = (role: "user" | "assistant") => role == "user" ? "You" : "Drak Šmak";

    return (
        <div key={props.key} className={"flex flex-row gap-2 py-6 rounded whitespace-pre-line " +
            (message.role === "assistant" && "bg-zinc-500/20 shadow px-6")}>
            <div className={"flex flex-col gap-1"}>
                <p className={"font-bold"}>
                    {getRoleNickname(message.role)}
                </p>
                <DangerousHtml>
                    {markdownContent}
                </DangerousHtml>
            </div>
        </div>
    )
}

function applyHtmlMarkdown(text: string): string {
    // Append triple backticks to the end of the text if there is an odd number of them.
    if ((text.match(/```/g) || []).length % 2 !== 0) {
        text += "```";
    }

    // Iterate through the content, replace triple backticks with <code>, and single backticks with <b>.
    // but only if they are not inside triple backticks.
    let insideCode = false;
    let insideBold = false;
    let markdownText = "";
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char !== "`") {
            markdownText += char;
            continue;
        }

        if (text[i+1] === "`" && text[i+2] === "`") {
            markdownText += insideCode ? "</code>" : "<code>";
            insideCode = !insideCode;
            i += 2;
            continue;
        }

        if (!insideCode) {
            markdownText += insideBold ? "</b>" : "<b>";
            insideBold = !insideBold;
        }
    }
    return markdownText;
}

function sanitizeMarkdown(text: string) {
    // Allow only <b> and <code> tags.
    return text.replace(/<(?!\/?(b|code))\/?.*?>/g, "");
}

function DangerousHtml(props: { children: string, className?: string }) {
    return <p className={props.className} dangerouslySetInnerHTML={{__html: props.children}}/>
}