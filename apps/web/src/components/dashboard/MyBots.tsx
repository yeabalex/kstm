'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Database,
  Globe,
  FileJson,
  FileType,
  Bot,
  MoreHorizontal,
  ArrowUpRight,
  Copy,
  Lock,
  Globe2,
  Loader2,
} from 'lucide-react';
import { Bots } from '@/types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AUTH_BASE_URL } from '@/const';

const BotCard = ({ bot, loading }: { bot: Bots; loading: boolean }) => {
  const [isPrivate, setIsPrivate] = useState(bot.private);
  const [isUpdating, setIsUpdating] = useState(false);
  const [botStatus, setBotStatus] = useState<'INDEXING' | 'READY' | 'FAILED'>(
    bot.status || 'READY'
  );
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    setBotStatus(bot.status || 'READY');
  }, [bot.status]);

  useEffect(() => {
    if (botStatus !== 'INDEXING') return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(
          `${AUTH_BASE_URL}/api/v1/bot/${bot.id}/status`,
          { withCredentials: true }
        );
        if (cancelled) return;
        if (typeof data.progress === 'number') {
          setProgress(data.progress);
        }
        if (data.status === 'READY' || data.job_state === 'completed') {
          setBotStatus('READY');
          clearInterval(interval);
        } else if (data.status === 'FAILED' || data.job_state === 'failed') {
          setBotStatus('FAILED');
          clearInterval(interval);
        }
      } catch {
        // Ignore transient polling errors
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bot.id, botStatus]);

  const truncateDescription = (text: string, maxLength = 110) => {
    if (!text) return 'No description configured for this assistant.';
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const renderKnowledgeBaseIcons = () => {
    const badges = [];

    if (bot.kb?.pdf?.length) {
      badges.push(
        <span
          key="pdf"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200/80 text-[11px] font-mono text-zinc-600"
        >
          <FileText className="w-3 h-3 text-zinc-400" />
          PDF ({bot.kb.pdf.length})
        </span>
      );
    }

    if (bot.kb?.csv?.length) {
      badges.push(
        <span
          key="csv"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200/80 text-[11px] font-mono text-zinc-600"
        >
          <Database className="w-3 h-3 text-zinc-400" />
          CSV ({bot.kb.csv.length})
        </span>
      );
    }

    if (bot.kb?.web_url?.length) {
      badges.push(
        <span
          key="web"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200/80 text-[11px] font-mono text-zinc-600"
        >
          <Globe className="w-3 h-3 text-zinc-400" />
          URL ({bot.kb.web_url.length})
        </span>
      );
    }

    if (bot.kb?.json?.length) {
      badges.push(
        <span
          key="json"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200/80 text-[11px] font-mono text-zinc-600"
        >
          <FileJson className="w-3 h-3 text-zinc-400" />
          JSON ({bot.kb.json.length})
        </span>
      );
    }

    if (bot.kb?.txt?.length) {
      badges.push(
        <span
          key="txt"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200/80 text-[11px] font-mono text-zinc-600"
        >
          <FileType className="w-3 h-3 text-zinc-400" />
          TXT ({bot.kb.txt.length})
        </span>
      );
    }

    return badges.length > 0 ? (
      <div className="flex items-center gap-1.5 flex-wrap">{badges}</div>
    ) : (
      <span className="text-[11px] font-mono text-zinc-400">
        No indexed sources
      </span>
    );
  };

  const chatUrl = `/chat/${bot.id}/${bot.kb?.id}`;

  const handleToggleAccess = async (newAccess: boolean) => {
    setIsUpdating(true);
    try {
      await axios.patch(
        `${AUTH_BASE_URL}/api/v1/bot/modify-access`,
        {
          bot_id: bot.id,
          private: newAccess,
        },
        {
          withCredentials: true,
        }
      );
      setIsPrivate(newAccess);
      toast.success(`Visibility set to ${newAccess ? 'Private' : 'Public'}`);
    } catch (error) {
      toast.error('Failed to update visibility');
      console.error('Failed to update access', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}${chatUrl}`)
      .then(() => {
        toast.success('Chat link copied');
      })
      .catch(() => {
        toast.error('Failed to copy link');
      });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-5 animate-pulse">
        <div className="h-5 bg-zinc-100 rounded w-3/4 mb-3" />
        <div className="h-4 bg-zinc-100 rounded w-full mb-2" />
        <div className="h-4 bg-zinc-100 rounded w-2/3" />
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-zinc-200/90 bg-white p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors">
      <div>
        {/* Top Row */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-700 shrink-0">
              {bot.profile_image ? (
                <img
                  src={bot.profile_image}
                  alt={bot.name}
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-950 truncate">
                {bot.name || 'Untitled Assistant'}
              </h3>
              <span className="text-[11px] font-mono text-zinc-400 block truncate">
                {bot.model}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                isPrivate
                  ? 'bg-zinc-50 text-zinc-600 border-zinc-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isPrivate ? (
                <Lock className="w-2.5 h-2.5" />
              ) : (
                <Globe2 className="w-2.5 h-2.5" />
              )}
              {isPrivate ? 'Private' : 'Public'}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                  aria-label="Assistant options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-zinc-200">
                <DropdownMenuItem
                  onClick={() => handleToggleAccess(!isPrivate)}
                  disabled={isUpdating}
                  className="text-xs cursor-pointer"
                >
                  {isPrivate ? (
                    <>
                      <Globe2 className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                      Make Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                      Make Private
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleCopyLink}
                  className="text-xs cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                  Copy Share URL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2 min-h-[2.25rem] mb-4">
          {truncateDescription(bot.description || '')}
        </p>

        {/* Knowledge Base Sources */}
        <div className="mb-4">{renderKnowledgeBaseIcons()}</div>
      </div>

      {/* Footer */}
      <div className="pt-3.5 border-t border-zinc-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {botStatus === 'INDEXING' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              <Loader2 className="w-3 h-3 animate-spin" />
              Indexing{progress > 0 ? ` ${progress}%` : ''}
            </span>
          ) : botStatus === 'FAILED' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              Failed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Ready
            </span>
          )}
          <span className="text-[11px] font-mono text-zinc-400">
            temp: {bot.temperature ?? 0.7}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
            title="Copy chat link"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <Link
            href={chatUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
          >
            <span>Open Chat</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export { BotCard };
