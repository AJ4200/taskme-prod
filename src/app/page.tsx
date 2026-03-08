"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Homepage from "~/components/Homepage";
import Notebook from "~/components/splash/Notebook";

export default function Home() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userId = sessionStorage.getItem("userId");

    if (token && userId) {
      router.replace("/tasks");
      return;
    }

    setIsCheckingSession(false);
  }, [router]);

  useEffect(() => {
    if (isCheckingSession) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setShowSplash(false);
    }, 9000);

    return () => clearTimeout(timeoutId);
  }, [isCheckingSession]);

  if (isCheckingSession) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {showSplash ? <Notebook /> : <Homepage />}
    </main>
  );
}
