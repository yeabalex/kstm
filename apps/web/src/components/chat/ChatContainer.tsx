"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import axios from "axios";
import { nanoid } from "nanoid";
import ApiClient from "@/lib/ApiClient";
import { AUTH_BASE_URL } from "@/const";
import NotFound from "@/NotFound";
import AuthWrapper from "../AuthWrapper";
import ChatLayout, { ChatSessionItem } from "./ChatLayout";

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: string;
  isLoading?: boolean;
}

interface Bot {
  name: string;
  model: string;
  user_id?: string;
  userId?: string;
  description: string;
  private: boolean;
}

function mergeSessions(
  remote: ChatSessionItem[],
  local: ChatSessionItem[]
): ChatSessionItem[] {
  const map = new Map<string, ChatSessionItem>();
  for (const item of local) {
    if (item?.id) map.set(item.id, item);
  }
  for (const item of remote) {
    if (item?.id) map.set(item.id, item);
  }
  return Array.from(map.values()).sort((a, b) => {
    const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return tB - tA;
  });
}

const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessId, setSessId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [loadingSessionMessages, setLoadingSessionMessages] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [bot, setBot] = useState<Bot | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [botLoaded, setBotLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userId } = useAuth();
  const { bot_id, kb_id } = useParams();
  const botIdStr = Array.isArray(bot_id) ? bot_id[0] : bot_id;

  const fetchSessions = useCallback(async () => {
    if (!botIdStr) return;

    let localSessions: ChatSessionItem[] = [];
    try {
      const raw = localStorage.getItem(`chat_sessions_${botIdStr}`);
      if (raw) {
        localSessions = JSON.parse(raw);
      }
    } catch {
      // ignore localStorage parse errors
    }

    try {
      const res = await axios.get(
        `${AUTH_BASE_URL}/api/v1/query/sessions/${botIdStr}`,
        { withCredentials: true }
      );
      const remoteSessions: ChatSessionItem[] = Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      const merged = mergeSessions(remoteSessions, localSessions);
      setSessions(merged);
      localStorage.setItem(`chat_sessions_${botIdStr}`, JSON.stringify(merged));
    } catch {
      setSessions(mergeSessions([], localSessions));
    }
  }, [botIdStr]);

  const loadSessionMessages = useCallback(async (targetSessionId: string) => {
    let localMessages: Message[] = [];
    try {
      const stored = localStorage.getItem(`chat_messages_${targetSessionId}`);
      if (stored) {
        localMessages = JSON.parse(stored);
      }
    } catch {
      // ignore localStorage parse errors
    }

    if (localMessages.length > 0) {
      setMessages(localMessages);
      setShowIntro(false);
    }

    try {
      if (localMessages.length === 0) {
        setLoadingSessionMessages(true);
      }
      const res = await axios.get(
        `${AUTH_BASE_URL}/api/v1/query/sessions/${targetSessionId}/messages`,
        { withCredentials: true }
      );
      const dbMsgs = Array.isArray(res.data?.data) ? res.data.data : [];
      if (dbMsgs.length > 0) {
        const formatted: Message[] = dbMsgs.map((m: any) => ({
          id: m.id || nanoid(),
          text: m.content,
          isAI: m.role === "ai",
          timestamp: m.createdAt || new Date().toISOString(),
        }));
        setMessages(formatted);
        setShowIntro(false);
        localStorage.setItem(
          `chat_messages_${targetSessionId}`,
          JSON.stringify(formatted)
        );
      } else if (localMessages.length === 0) {
        setMessages([]);
        setShowIntro(true);
      }
    } catch {
      if (localMessages.length === 0) {
        setMessages([]);
        setShowIntro(true);
      }
    } finally {
      setLoadingSessionMessages(false);
    }
  }, []);

  // Session setup & initial history fetch
  useEffect(() => {
    if (!botIdStr) return;
    const sessionKey = `sess_id_${botIdStr}`;
    let id = sessionStorage.getItem(sessionKey);
    if (!id) {
      id = nanoid();
      sessionStorage.setItem(sessionKey, id);
    }
    setSessId(id);
    fetchSessions();
    loadSessionMessages(id);
  }, [botIdStr, fetchSessions, loadSessionMessages]);

  // Save messages to localStorage whenever non-empty
  useEffect(() => {
    if (!sessId || messages.length === 0) return;
    const persistable = messages.filter((m) => !m.isLoading);
    if (persistable.length > 0) {
      localStorage.setItem(
        `chat_messages_${sessId}`,
        JSON.stringify(persistable)
      );
    }
  }, [messages, sessId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load bot info
  useEffect(() => {
    async function getBot() {
      try {
        const res = await axios.get(`${AUTH_BASE_URL}/api/v1/bot/${botIdStr}`);
        setBot(res.data);
      } catch (e: any) {
        if (axios.isAxiosError(e)) {
          setStatus(e.response?.data.status);
        }
      } finally {
        setBotLoaded(true);
      }
    }

    if (botIdStr) getBot();
  }, [botIdStr]);

  const handleSendMessage = async (text: string) => {
    if (!sessId || !botIdStr) return;

    const nowIso = new Date().toISOString();
    const userMessage: Message = {
      id: nanoid(),
      text,
      isAI: false,
      timestamp: nowIso,
    };

    const loadingMessageId = nanoid();
    const loadingMessage: Message = {
      id: loadingMessageId,
      text: "",
      isAI: true,
      timestamp: nowIso,
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setShowIntro(false);

    // Optimistically add or bump current session in sidebar
    setSessions((prev) => {
      const existing = prev.find((s) => s.id === sessId);
      const updatedItem: ChatSessionItem = {
        id: sessId,
        title: existing?.title || text.slice(0, 50),
        createdAt: existing?.createdAt || nowIso,
        updatedAt: nowIso,
      };
      const next = mergeSessions([updatedItem], prev);
      try {
        localStorage.setItem(`chat_sessions_${botIdStr}`, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });

    const apiClient = new ApiClient(AUTH_BASE_URL);
    const query = {
      user_id: bot?.user_id || bot?.userId || userId || undefined,
      bot_id: botIdStr,
      kb_id,
      session_id: sessId,
      input_text: text,
    };

    try {
      const res = await apiClient.post("/api/v1/query", query);
      const aiText = res.data.externalData.answer;

      const aiMessage: Message = {
        id: nanoid(),
        text: aiText,
        isAI: true,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === loadingMessageId ? aiMessage : msg))
      );

      // Refresh sessions from backend after persistence
      fetchSessions();
    } catch (error) {
      const errorMessage: Message = {
        id: nanoid(),
        text: "Unable to retrieve a response from the assistant. Please verify the worker service is running and try again.",
        isAI: true,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === loadingMessageId ? errorMessage : msg))
      );
    }
  };

  const handleNewSession = () => {
    if (!botIdStr) return;
    const newId = nanoid();
    sessionStorage.setItem(`sess_id_${botIdStr}`, newId);
    setSessId(newId);
    setMessages([]);
    setShowIntro(true);
  };

  const handleSelectSession = (targetSessionId: string) => {
    if (!botIdStr || targetSessionId === sessId) return;
    sessionStorage.setItem(`sess_id_${botIdStr}`, targetSessionId);
    setSessId(targetSessionId);
    loadSessionMessages(targetSessionId);
  };

  if (!sessId || !botLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-50 gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-300 border-t-zinc-900" />
        <p className="text-xs font-mono text-zinc-500">Loading assistant...</p>
      </div>
    );
  }

  if (status === 404) {
    return <NotFound />;
  }

  const layout = (
    <ChatLayout
      bot={bot!}
      messages={messages}
      showIntro={showIntro}
      handleSendMessage={handleSendMessage}
      handleNewSession={handleNewSession}
      messagesEndRef={messagesEndRef}
      sessions={sessions}
      activeSessionId={sessId}
      onSelectSession={handleSelectSession}
      loadingSessionMessages={loadingSessionMessages}
    />
  );

  return bot?.private ? <AuthWrapper>{layout}</AuthWrapper> : layout;
};

export default ChatContainer;
