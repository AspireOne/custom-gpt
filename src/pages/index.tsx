import {type NextPage} from "next";
import {signIn, signOut, useSession} from "next-auth/react";
import Head from "next/head";
import {api} from "~/utils/api";
import {Modal, Textarea, useMantineTheme} from "@mantine/core";
import {FcGoogle} from "react-icons/fc";
import {notifications} from "@mantine/notifications";
import useMessages from "~/hooks/useMessages";
import useLLM from "usellm";
import {useEffect, useState} from "react";
import {Message} from "~/server/ChatUtils";
import useLocalChat from "~/hooks/useLocalChat";

const jesusFrames = [
    "/j1.png",
    "/j2.png",
]

const Home: NextPage = () => {
    const [streaming, setStreaming] = useState(false);
    const chat = useLocalChat([
        { role: "system", content: "Jsi Ježíš. Odpovídáš lidem, radíš jim, povídáš si s němi. Musíš za každou" +
                " cenu zůstat v roli Ježíše. Piš krátké zprávy." },
        { role: "assistant", content: "Mé jméno jest Ježíš. Jak ti mohu pomoci, mé dítě?"},
        /*{ role: "user", content: "Nazdar, já som slavko"}*/
    ]);
    const {data, status} = useSession();
    const llm = useLLM({ serviceUrl: "/api/chat/reply" });

    function getNextTextToRead(content: string, index: number, skipLastWord = true): string {
        content = content.slice(index);
        const words = content.split(" ");
        if (skipLastWord && !content.endsWith(" ")) {
            words.pop();
        }
        return words.slice(index).join(" ");
    }

    async function getResponse(message: string) {
        setStreaming(true);
        const messages = chat.push({role: "user", content: message});
        let readIndex = 0;
        let finalContent = "";
        let speaking = false;
        try {
            await llm.chat({
                template: "default-jesus",
                messages: messages,
                stream: true,
                onStream: ({ message, isFirst, isLast }) => {
                    if (isFirst) {
                        chat.push({role: "assistant", content: message.content})
                        return;
                    }
                    if (isLast) {
                        finalContent = message.content;
                        speakText(finalContent);
                    }
                    chat.replaceLastMessage({role: "assistant", content: message.content});

                    /*if (!speaking && message.content.split(" ").length > 5) {
                        const text = getNextTextToRead(message.content, readIndex);
                        readIndex = text.length;
                        speaking = true;
                        speakText(text, () => speaking = false);
                    }*/
                },
            });
        } catch (error) {
            console.error("Something went wrong!", error);
        }

        /*if (finalContent.length != readIndex) {
            const words = getNextTextToRead(finalContent, readIndex, false);
            speakText(words);
        }*/
        setStreaming(false);
    }

    return (
        <>
            <Head>
                <title>Ježíš</title>
                <meta name="description" content="Rozhraní, které transcenduje mezi světem naším a svatým, a umožní
        vám komunikovat s ježíšem přímo z pohodlí vašeho domova."/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <main className="flex min-h-screen flex-col items-center justify-center bg-jesus bg-cover">
                {status === "unauthenticated" && <SignInModal/>}
                <div className={"flex flex-col lg:flex-row gap-0 w-screen h-screen"}>
                    <div className={"border border-black w-full h-full p-12"}>
                        <Jesus talking={streaming}/>
                    </div>
                    <div className={"w-full h-full p-12"}>
                        <ChatUi messages={chat.messages}
                                inputDisabled={streaming}
                                onSend={message => getResponse(message)}
                                className={"bg-gray-700/90 min-h-full h-full overflow-y-auto max-h-full p-4 rounded-lg"}/>
                    </div>
                </div>
            </main>
        </>
    );
};

function Jesus(props:{talking?: boolean}) {
    // There will be a talking animation - two images (j1 and j2) will be switched every 0.5s.
    const [frame, setFrame] = useState(0);
    const [id, setId] = useState<number | null>(null);

    useEffect(() => {
        if (props.talking) startTalking();
        else stopTalking();
    }, [props.talking]);

    function startTalking() {
        const id = window.setInterval(() => {
            setFrame(frame => (frame + 1) % 2);
        }, 300);
        setId(id);
    }

    function stopTalking() {
        setFrame(0);
        if (id) {
            window.clearInterval(id);
            setId(null);
        }
    }

    return (
         <div className={"w-full h-full flex justify-center"}>
             <img src={jesusFrames[frame]} className={"h-auto w-auto mx-auto my-auto"}/>
         </div>
    )
}

function speakText(text: string, onEnd?: () => void) {
    if ('speechSynthesis' in window) {
        // Create a new utterance with the received text chunk
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.5;
        if (onEnd) utterance.onend = onEnd;
        // Set utterance properties (voice, pitch, rate, volume)
        // Speak the utterance
        window.speechSynthesis.speak(utterance);
    } else {
        console.log('Text-to-speech not supported.');
    }
}


function ChatUi(props: { messages: Message[], className?: string,
    onSend: (message: string) => void, inputDisabled?: boolean }) {
    return (
        <div className={"flex flex-col justify-between gap-2 " + props.className}>
            <div className={"flex flex-col"}>
                {props.messages.map((message: Message, index) => {
                    if (message.role === "system") return null;
                    return (
                        <div className={"flex flex-row gap-2"} key={index}>
                            <div className={"flex flex-col gap-1"}>
                                <p className={"font-bold"}>{getRoleNickname(message.role)}</p>
                                <p>{message.content}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            <ChatInput onSend={props.onSend} disabled={props.inputDisabled} className={""}/>
        </div>
    )
}

function ChatInput(props: { onSend: (message: string) => void, disabled?: boolean, className?: string }) {
    // A chat input - allows the user to send messages.
    const [message, setMessage] = useState("");

    async function sendMessage() {
        props.onSend(message);
        setMessage("");
    }

    return (
        <div className={"flex flex-row gap-2 " + props.className}>
            <Textarea value={message} onChange={e => setMessage(e.currentTarget.value)}
                      placeholder={"Napište zprávu..."} className={"flex-grow"}/>
            <button onClick={sendMessage} disabled={props.disabled} className={"px-3 py-2 bg-transparent rounded-md border border-zinc-500"}>
                Odeslat
            </button>
        </div>
    )
}

function getRoleNickname(role: "user" | "assistant" | "system") {
    switch (role) {
        case "user":
            return "Vy";
        case "assistant":
            return "Ježíš";
        case "system":
            return "Bůh";
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

export default Home;