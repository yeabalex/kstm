'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import { AUTH_BASE_URL } from "@/const";
import { useAuth } from "@/context/AuthContext";
import { Bots } from "@/types";
import { BotCard } from "./MyBots";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";
import { Plus, Bot, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const [bot, setBot] = useState<Bots[]>([]);
  const [status, setStatus] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();
  const { userId } = useAuth();

  useEffect(() => {
    async function getBot() {
      try {
        setLoading(true);
        const res = await axios.get(`${AUTH_BASE_URL}/api/v1/bot?userId=${userId}`, {
          withCredentials: true,
        });
        setBot(res.data);
      } catch (e) {
        if (axios.isAxiosError(e)) {
          setStatus(e.response?.data.status);
        }
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      getBot();
    }
  }, [userId]);

  const onButtonClick = () => {
    router.push('/dashboard/create');
  };

  const visibleBots = showAll ? bot : bot.slice(0, 8);

  return (
    <div className="min-h-full bg-zinc-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-zinc-200/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
                Assistants
              </h1>
              {!loading && (
                <span className="text-xs font-mono text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5 rounded-md">
                  {bot.length}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Manage your deployed RAG assistants, knowledge base sources, and sharing permissions.
            </p>
          </div>

          <button
            onClick={onButtonClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Assistant</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="p-5 rounded-xl border border-zinc-200/80 bg-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
                <Skeleton className="h-5 w-2/3 mb-2 rounded" />
                <Skeleton className="h-4 w-full mb-4 rounded" />
                <Skeleton className="h-9 w-full rounded-lg mt-6" />
              </div>
            ))}
          </div>
        ) : bot.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleBots.map((bots) => (
                <BotCard key={bots.id} bot={bots} loading={loading} />
              ))}
            </div>
            {bot.length > 8 && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAll((prev) => !prev)}
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-950 bg-white border border-zinc-200 px-4 py-2 rounded-lg transition-colors"
                >
                  {showAll ? "Show fewer" : `Show all (${bot.length})`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white border border-zinc-200/90 rounded-xl p-12 text-center max-w-lg mx-auto my-8">
            <div className="mx-auto w-10 h-10 bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-center mb-4 text-zinc-600">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-950 mb-1">
              No assistants deployed yet
            </h3>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed max-w-sm mx-auto">
              Upload PDF, CSV, JSON, or TXT documents, or connect web pages to index your first knowledge-grounded assistant.
            </p>
            <button
              onClick={onButtonClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Assistant</span>
            </button>
          </div>
        )}

        {status && (
          <div className="mt-6 p-4 bg-red-50/80 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>Error loading assistants (status: {status})</span>
          </div>
        )}
      </div>
    </div>
  );
}
