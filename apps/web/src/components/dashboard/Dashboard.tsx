'use client'
import { useEffect, useState } from "react";
import axios from "axios";
import { AUTH_BASE_URL } from "@/const";
import { useAuth } from "@/context/AuthContext";
import { Bots } from "@/types";
import { BotCard } from "./MyBots";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

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
                const bot = await axios.get(`${AUTH_BASE_URL}/api/v1/bot?userId=${userId}`);
                setBot(bot.data);
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

    const visibleBots = showAll ? bot : bot.slice(0, 3);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">My Bots</h1>
                    <p className="text-slate-600 text-lg">Manage and monitor your AI assistants</p>
                    {bot.length > 0 && (
                        <div className="mt-4 flex items-center gap-2">
                            <div className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                {bot.length} {bot.length === 1 ? 'Bot' : 'Bots'}
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="p-4 rounded-lg border bg-white shadow">
                                <Skeleton className="h-40 w-full mb-4 rounded-md" />
                                <Skeleton className="h-4 w-3/4 mb-2 rounded" />
                                <Skeleton className="h-4 w-1/2 rounded" />
                            </div>
                        ))}
                    </div>
                ) : bot.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {visibleBots.map((bots) => (
                                <div key={bots.id} className="transform transition-all duration-200 hover:scale-100 hover:shadow-lg">
                                    <BotCard bot={bots} loading={loading} />
                                </div>
                            ))}
                        </div>
                        {bot.length > 3 && (
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => setShowAll(prev => !prev)}
                                    className="text-blue-600 font-medium hover:underline"
                                >
                                    {showAll ? "Show Less" : "Show All"}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No bots yet</h3>
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                            You haven&apos;t created any bots yet. Start building your first AI assistant to get started.
                        </p>
                        <Button onClick={onButtonClick} className="bg-blue-600 text-white hover:bg-blue-700">
                            Create New Bot
                        </Button>
                    </div>
                )}

                {status && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd" />
                            </svg>
                            <p className="text-red-800 font-medium">
                                Error loading bots: {status}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
