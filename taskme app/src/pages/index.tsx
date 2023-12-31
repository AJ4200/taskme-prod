import Head from "next/head";
import Homepage from "./homepage";
import Notebook from "~/components/splash/Notebook";
import { useEffect, useState } from "react";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {

    const timeoutId = setTimeout(() => {
      setShowSplash(false);
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <Head>
        <title>Task.Me</title>
        <meta name="description" content="Task everybody" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        {showSplash ? <Notebook /> : <Homepage />}
      </main>
    </>
  );
}
