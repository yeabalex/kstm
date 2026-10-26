"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import axios from "axios";
import { nanoid } from "nanoid";
import ApiClient from "@/lib/ApiClient";
import { AUTH_BASE_URL } from "@/const";
import NotFound from "@/NotFound";
import AuthWrapper from "../AuthWrapper";
import ChatLayout from "./ChatLayout";

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
  user_id: string;
  description: string;
  private: boolean;
}

const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessId, setSessId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [bot, setBot] = useState<Bot | null>(null); // ✅ null instead of undefined
  const [status, setStatus] = useState<number | null>(null);
  const [botLoaded, setBotLoaded] = useState(false); // ✅ track when bot info is loaded
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userId } = useAuth();
  const { bot_id, kb_id } = useParams();

  // Session setup
  useEffect(() => {
    if (!bot_id) return;
    const sessionKey = `sess_id_${bot_id}`;
    let id = sessionStorage.getItem(sessionKey);
    if (!id) {
      id = nanoid();
      sessionStorage.setItem(sessionKey, id);
    }
    setSessId(id);
  }, [bot_id]);

  // Load messages
  useEffect(() => {
    if (!sessId) return;
    const stored = localStorage.getItem(`chat_messages_${sessId}`);
    if (stored) {
      const parsed: Message[] = JSON.parse(stored);
      setMessages(parsed);
      setShowIntro(parsed.length === 0);
    }
  }, [sessId]);

  // Save messages
  useEffect(() => {
    if (!sessId) return;
    localStorage.setItem(`chat_messages_${sessId}`, JSON.stringify(messages));
  }, [messages, sessId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load bot info
  useEffect(() => {
    async function getBot() {
      try {
        const res = await axios.get(`${AUTH_BASE_URL}/api/v1/bot/${bot_id}`);
        setBot(res.data);
      } catch (e: any) {
        if (axios.isAxiosError(e)) {
          setStatus(e.response?.data.status);
        }
      } finally {
        setBotLoaded(true); // ✅ Mark bot loading complete
      }
    }

    if (bot_id) getBot();
  }, [bot_id]);

  const handleSendMessage = async (text: string) => {
    if (!sessId) return;

    const userMessage: Message = {
      id: nanoid(),
      text,
      isAI: false,
      timestamp: new Date().toISOString(),
    };

    const loadingMessageId = nanoid();
    const loadingMessage: Message = {
      id: loadingMessageId,
      text: "",
      isAI: true,
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setShowIntro(false);

    const apiClient = new ApiClient(AUTH_BASE_URL);
    const query = {
      user_id: bot?.user_id,
      bot_id,
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
    } catch (error) {
      const errorMessage: Message = {
        id: nanoid(),
        text: "❌ Failed to get a response. Please try again.",
        isAI: true,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === loadingMessageId ? errorMessage : msg))
      );
    }
  };

  const handleNewSession = () => {
    const newId = nanoid();
    sessionStorage.setItem(`sess_id_${bot_id}`, newId);
    setSessId(newId);
    setMessages([]);
    setShowIntro(true);
  };

  if (!sessId || !botLoaded) {
    return <div className="p-4 text-center">Loading chat...</div>; // ✅ only render after loading
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
    />
  );

  return bot?.private ? <AuthWrapper>{layout}</AuthWrapper> : layout;
};

export default ChatContainer;
