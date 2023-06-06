import {type NextPage} from "next";
import {signIn, signOut, useSession} from "next-auth/react";
import Head from "next/head";
import {api} from "~/utils/api";
import {Modal, Textarea, useMantineTheme} from "@mantine/core";
import {FcGoogle} from "react-icons/fc";
import {notifications} from "@mantine/notifications";
import useMessages from "~/hooks/useMessages";
import useLLM from "usellm";
import {useState} from "react";
import {Message} from "~/server/ChatUtils";
import useLocalChat from "~/hooks/useLocalChat";

const Home: NextPage = () => {
    const [streaming, setStreaming] = useState(false);
    const chat = useLocalChat([
        { role: "system", content: "Jsi Ježíš. Odpovídáš lidem, radíš jim, povídáš si s němi. Musíš za každou" +
                " cenu zůstat v roli Ježíše. Piš krátké zprávy." },
        { role: "assistant", content: "Mé jméno je Ježíš. Jak ti mohu pomoci, mé dítě?"},
        /*{ role: "user", content: "Nazdar, já som slavko"}*/
    ]);
    const {data, status} = useSession();
    const llm = useLLM({ serviceUrl: "/api/chat/reply" });

    async function getResponse(message: string) {
        setStreaming(true);
        chat.push({role: "user", content: message});
        try {
            await llm.chat({
                template: "default-jesus",
                messages: chat.messages,
                stream: true,
                onStream: ({ message, isFirst, isLast }) => {
                    if (isFirst) chat.push({role: "assistant", content: message.content})
                    else chat.replaceLastMessage({role: "assistant", content: message.content});
                },
            });
        } catch (error) {
            console.error("Something went wrong!", error);
        }
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
                <div className={"flex flex-col lg:flex-row gap-0 w-screen h-screen border border-amber-950 border-8"}>
                    <div className={"relative border border-black w-full h-full p-12"}>
                        <img src={"/jesus-1.png"} className={"absolute bottom-0 right-0 h-full"}/>
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

function ChatUi(props: { messages: Message[], className?: string,
    onSend: (message: string) => void, inputDisabled?: boolean }) {
    return (
        <div className={"flex flex-col gap-2 " + props.className}>
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
            <ChatInput onSend={props.onSend} disabled={props.inputDisabled}/>
        </div>
    )
}

function ChatInput(props: { onSend: (message: string) => void, disabled?: boolean }) {
    // A chat input - allows the user to send messages.
    const [message, setMessage] = useState("");

    async function sendMessage() {
        props.onSend(message);
        setMessage("");
    }

    return (
        <div className={"flex flex-row gap-2"}>
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