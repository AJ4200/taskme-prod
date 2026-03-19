"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listFriendConnectionsAction } from "~/actions/accountability";
import { listConversationAction, sendMessageAction } from "~/actions/social";
import { getAllTasksAction } from "~/actions/task";
import { useNotifications } from "../providers/NotificationProvider";
import multiavatar from "@multiavatar/multiavatar/esm";

interface InboxAlertRow {
  id: string;
  title: string;
  body?: string | null;
  status: string;
  kind: "friend_request" | "assigned_task";
  createdAt: string | Date;
}

interface FriendRow {
  friendshipId?: string;
  isIncoming?: boolean;
  friend: {
    id: string;
    username: string;
  };
  status: string;
}

interface MessageRow {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  createdAt: string | Date;
  sender?: { username: string };
}

const InboxBoard: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotifications();
  const [userId, setUserId] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [alerts, setAlerts] = useState<InboxAlertRow[]>([]);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedFriendName = useMemo(
    () => friends.find((row) => row.friend.id === selectedFriendId)?.friend.username ?? "",
    [friends, selectedFriendId],
  );

  const refresh = useCallback(async (uid: string) => {
    setLoading(true);
    const [fRes, taskRes] = await Promise.all([
      listFriendConnectionsAction(uid, "ACCEPTED"),
      getAllTasksAction(undefined, uid),
    ]);

    if (!fRes.success) notifyError(fRes.error ?? "Failed to load friends.");
    if (!taskRes.success) notifyError(taskRes.error ?? "Failed to load assigned tasks.");

    const requestRes = await listFriendConnectionsAction(uid);
    const incomingRequestAlerts: InboxAlertRow[] = requestRes.success
      ? (
          ((requestRes.data as Array<{
            friendshipId: string;
            isIncoming: boolean;
            status: string;
            createdAt: string | Date;
            friend: { username: string };
          }> | undefined) ?? []
          ).filter((row) => row.isIncoming && row.status === "PENDING")
        ).map((row) => ({
          id: `fr-${row.friendshipId}`,
          title: "New friend request",
          body: `${row.friend.username} sent you a friend request.`,
          status: row.status,
          kind: "friend_request",
          createdAt: row.createdAt,
        }))
      : [];

    const assignedTaskAlerts: InboxAlertRow[] = taskRes.success
      ? (
          ((taskRes.data as Array<{
            id: string;
            title: string;
            ownerId: string;
            assigneeId: string;
            createdAt: string | Date;
          }> | undefined) ?? []
          ).filter((task) => task.ownerId !== uid && task.assigneeId === uid)
        ).map((task) => ({
          id: `task-${task.id}`,
          title: "Task assigned",
          body: `"${task.title}" is assigned to you.`,
          status: "PENDING",
          kind: "assigned_task",
          createdAt: task.createdAt,
        }))
      : [];

    setAlerts(
      [...incomingRequestAlerts, ...assignedTaskAlerts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
    setFriends(fRes.success ? ((fRes.data as FriendRow[] | undefined) ?? []) : []);
    setLoading(false);
  }, [notifyError]);

  const loadConversation = useCallback(async () => {
    if (!userId || !selectedFriendId) {
      setMessages([]);
      return;
    }
    const result = await listConversationAction(userId, selectedFriendId);
    if (!result.success) {
      notifyError(result.error ?? "Failed to load conversation.");
      return;
    }
    setMessages((result.data as MessageRow[] | undefined) ?? []);
  }, [notifyError, selectedFriendId, userId]);

  useEffect(() => {
    const uid = sessionStorage.getItem("userId") ?? "";
    const uname = sessionStorage.getItem("username") ?? "";
    setUserId(uid);
    setCurrentUsername(uname);
    if (!uid) {
      setLoading(false);
      return;
    }
    void refresh(uid);
  }, [refresh]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!userId || !selectedFriendId) return;
    const intervalId = window.setInterval(() => {
      void loadConversation();
    }, 2500);
    return () => window.clearInterval(intervalId);
  }, [loadConversation, selectedFriendId, userId]);

  const alertCount = alerts.length;

  if (loading) return <div className="loader mt-2" />;

  return (
    <div className="space-y-4">
      <h2 className="text-center text-4xl underline">Inbox</h2>

      <div className="box bg-yellow-50/80 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-lg font-semibold">Inbox Alerts ({alertCount})</p>
          <button type="button" className="box bg-white px-2 text-sm" onClick={() => void refresh(userId)}>
            Refresh
          </button>
        </div>

        <div className="space-y-2">
          {alerts.length === 0 ? (
            <p className="text-sm">No notifications yet.</p>
          ) : (
            alerts.map((item) => (
              <div
                key={item.id}
                className={`box block w-full px-3 py-2 text-left text-sm ${
                  item.kind === "friend_request" ? "bg-orange-100/80" : "bg-sky-100/80"
                }`}
              >
                <p className="font-semibold">{item.title}</p>
                {item.body && <p>{item.body}</p>}
                <p className="text-xs opacity-70">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="box bg-sky-50/80 p-3">
        <h3 className="mb-2 text-2xl underline">Messages (friends only)</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px,1fr]">
          <div className="max-h-[22rem] space-y-2 overflow-y-auto border border-gray-700/20 p-2">
            {friends.length === 0 ? (
              <p className="text-sm">No accepted friends yet.</p>
            ) : (
              friends.map((row) => {
                const isActive = row.friend.id === selectedFriendId;
                return (
                  <button
                    key={row.friend.id}
                    type="button"
                    className={`box block w-full px-2 py-2 text-left text-sm ${
                      isActive ? "bg-amber-100" : "bg-white/70"
                    }`}
                    onClick={() => setSelectedFriendId(row.friend.id)}
                  >
                    <p className="font-semibold">{row.friend.username}</p>
                    <p className="text-xs opacity-70">Tap to open chat</p>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex min-h-[22rem] flex-col border border-gray-700/20 bg-white/50 p-2">
            {selectedFriendId ? (
              <>
                <div className="mb-2 border-b border-gray-700/20 pb-2">
                  <p className="text-lg font-semibold">{selectedFriendName}</p>
                  <p className="text-xs opacity-70">Auto-sync every 2.5s</p>
                </div>

                <div
                  ref={messagesContainerRef}
                  className="flex-1 space-y-2 overflow-y-auto pr-1"
                >
                  {messages.length === 0 ? (
                    <p className="text-sm">No messages yet. Start the conversation.</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[85%] rounded px-2 py-1 text-sm ${
                          message.senderId === userId
                            ? "ml-auto bg-emerald-100/90 text-right"
                            : "mr-auto bg-gray-100/90 text-left"
                        }`}
                      >
                        <p className="flex items-center gap-1 font-semibold">
                          <svg
                            className="h-4 w-4 rounded-full object-cover"
                            dangerouslySetInnerHTML={{
                              __html: multiavatar(
                                message.senderId === userId
                                  ? currentUsername || "You"
                                  : message.sender?.username ?? selectedFriendName,
                              ),
                            }}
                          />
                          <span>
                            {message.senderId === userId
                              ? "You"
                              : message.sender?.username ?? selectedFriendName}
                          </span>
                        </p>
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void (async () => {
                      const content = draft.trim();
                      if (!content || isSending) return;
                      setIsSending(true);
                      const result = await sendMessageAction({
                        senderId: userId,
                        recipientId: selectedFriendId,
                        content,
                      });
                      if (!result.success) {
                        notifyError(result.error ?? "Failed to send message.");
                        setIsSending(false);
                        return;
                      }
                      setDraft("");
                      notifySuccess("Message sent.");
                      await loadConversation();
                      setIsSending(false);
                    })();
                  }}
                  className="mt-2 flex gap-2"
                >
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Message ${selectedFriendName}`}
                    className="w-full border px-2"
                  />
                  <button type="submit" className="box bg-white px-3" disabled={isSending}>
                    {isSending ? "..." : "Send"}
                  </button>
                </form>
              </>
            ) : (
              <p className="m-auto text-sm">Select a friend from the left to open chat.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxBoard;
