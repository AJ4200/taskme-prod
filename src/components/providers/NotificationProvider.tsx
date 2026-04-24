"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type NotificationType = "success" | "error" | "fail" | "warning" | "request" | "chat";

interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextValue {
  notify: (type: NotificationType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  fail: (message: string) => void;
  warning: (message: string) => void;
  request: (message: string) => void;
  chat: (message: string) => void;
}

const PENDING_NOTIFICATION_KEY = "__taskme_notification__";

const NotificationContext = createContext<NotificationContextValue | null>(null);

const getTypeClassName = (type: NotificationType) => {
  if (type === "success") return "text-emerald-700";
  if (type === "error") return "text-red-700";
  if (type === "fail") return "text-rose-700";
  if (type === "warning") return "text-amber-700";
  if (type === "request") return "text-orange-700";
  return "text-sky-700";
};

export const setPendingNotification = (type: NotificationType, message: string) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_NOTIFICATION_KEY, JSON.stringify({ type, message }));
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const notify = useCallback((type: NotificationType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_NOTIFICATION_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { type?: NotificationType; message?: string };
      if (parsed.type && parsed.message) {
        notify(parsed.type, parsed.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      sessionStorage.removeItem(PENDING_NOTIFICATION_KEY);
    }
  }, [notify]);

  useEffect(() => {
    const resolveTarget = () => {
      const target = document.getElementById("notepad-notification-host");
      setPortalTarget(target);
    };

    resolveTarget();
    window.addEventListener("focus", resolveTarget);
    window.addEventListener("hashchange", resolveTarget);
    return () => {
      window.removeEventListener("focus", resolveTarget);
      window.removeEventListener("hashchange", resolveTarget);
    };
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify,
      success: (message) => notify("success", message),
      error: (message) => notify("error", message),
      fail: (message) => notify("fail", message),
      warning: (message) => notify("warning", message),
      request: (message) => notify("request", message),
      chat: (message) => notify("chat", message),
    }),
    [notify],
  );

  const feed = (
    <div
      className={`pointer-events-none z-[1000] flex w-full max-w-sm flex-col items-end gap-1 text-right ${
        portalTarget ? "absolute bottom-2 right-3" : "fixed bottom-3 right-3"
      }`}
    >
      {items.map((item) => (
        <div key={item.id} className={`text-xs font-semibold ${getTypeClassName(item.type)}`}>
          {item.type.toUpperCase()}: {item.message}
        </div>
      ))}
    </div>
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {portalTarget ? createPortal(feed, portalTarget) : feed}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
