"use client";

import { useEffect, useState } from "react";
import Homepage from "~/components/Homepage";
import Notebook from "~/components/splash/Notebook";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowSplash(false);
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {showSplash ? <Notebook /> : <Homepage />}
    </main>
  );
}
