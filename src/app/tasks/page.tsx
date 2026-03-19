"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Notepad from "~/components/notepad/Notepad";
import { setPendingNotification } from "~/components/providers/NotificationProvider";

export default function TasksPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const userId = sessionStorage.getItem("userId");

    if (!token || !userId) {
      setPendingNotification("info", "Please log in to continue.");
      router.replace("/");
      return;
    }

    setIsReady(true);
  }, [router]);

  if (!isReady) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Notepad />
    </div>
  );
}
