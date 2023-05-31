import { type NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import {Modal, useMantineTheme} from "@mantine/core";
import {FcGoogle} from "react-icons/fc";

const Home: NextPage = () => {
  const { data, status } = useSession();
  const hello = api.example.hello.useQuery({ text: "from tRPC" });

  return (
    <>
      <Head>
        <title>Ježíš</title>
        <meta name="description" content="Rozhraní, které transcenduje mezi světem naším a svatým, a umožní
        vám komunikovat s ježíšem přímo z pohodlí vašeho domova." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {status === "unauthenticated" && <SignInModal/>}
      <main className="flex min-h-screen flex-col items-center justify-center">

      </main>
    </>
  );
};

function SignInModal() {
  const theme = useMantineTheme();
  return (
      <Modal opened={true} onClose={() => {}} withCloseButton={false} centered
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