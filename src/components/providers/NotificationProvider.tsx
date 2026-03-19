"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type NotificationType = "success" | "error" | "info";

interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextValue {
  notify: (type: NotificationType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const PENDING_NOTIFICATION_KEY = "__taskme_notification__";

const NotificationContext = createContext<NotificationContextValue | null>(null);

const getTypeClassName = (type: NotificationType) => {
  if (type === "success") return "border-emerald-700/40 bg-emerald-100/95 text-emerald-900";
  if (type === "error") return "border-red-700/40 bg-red-100/95 text-red-900";
  return "border-sky-700/40 bg-sky-100/95 text-sky-900";
};

export const setPendingNotification = (type: NotificationType, message: string) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_NOTIFICATION_KEY, JSON.stringify({ type, message }));
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const notify = useCallback((type: NotificationType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
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

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify,
      success: (message) => notify("success", message),
      error: (message) => notify("error", message),
      info: (message) => notify("info", message),
    }),
    [notify],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[1000] flex w-full max-w-sm flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`box border px-3 py-2 text-sm shadow-lg ${getTypeClassName(item.type)}`}
          >
            {item.message}
          </div>
        ))}
      </div>
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
