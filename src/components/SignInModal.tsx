import {Modal, useMantineTheme} from "@mantine/core";
import {signIn} from "next-auth/react";
import {FcGoogle} from "react-icons/fc";
import React from "react";

export default function SignInModal() {
    const theme = useMantineTheme();
    return (
        <Modal
            opened={true}
            onClose={() => {}}
            withCloseButton={false}
            centered
            overlayProps={{
                color: theme.colorScheme === 'dark' ? theme.colors.dark[9] : theme.colors.gray[2],
                opacity: 0.55,
                blur: 3,
            }}
        >
            <p className={"text-center text-lg"}>Před pokračováním se prosím přihlašte</p>
            <button
                onClick={() => signIn("google")}
                className={"px-3 py-2 bg-transparent rounded-md border border-zinc-500 " +
                        "mx-auto flex flex-row gap-4 items-center my-6"}>
                <FcGoogle size={20}/>
                <p className={"font-bold text-sm"}>
                    Přihlásit se přes Google
                </p>
            </button>
        </Modal>
    )
}