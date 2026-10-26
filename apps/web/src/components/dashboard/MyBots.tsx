'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Database,
  Globe,
  FileJson,
  FileType,
  Bot,
  Cpu,
  Settings,
  MessageSquare,
  Share,
} from 'lucide-react';
import { Bots } from '@/types';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AUTH_BASE_URL } from '@/const';

const BotCard = ({ bot, loading }: { bot: Bots; loading: boolean }) => {
  const [isPrivate, setIsPrivate] = useState(bot.private);
  const [isUpdating, setIsUpdating] = useState(false);

  const themes = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    pink: 'bg-pink-50 border-pink-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    gray: 'bg-gray-50 border-gray-200',
    default: 'bg-gray-50 border-gray-200',
  };

  const colors = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    pink: 'text-pink-600 bg-pink-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    gray: 'text-gray-600 bg-gray-100',
    default: 'text-gray-600 bg-gray-100',
  };

  const getThemeColors = (theme: keyof typeof themes) =>
    themes[theme] || themes.default;

  const getIconColor = (theme: keyof typeof colors) =>
    colors[theme] || colors.default;

  const truncateDescription = (text: string, maxLength = 100) => {
    if (!text) return 'No description available';
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const renderKnowledgeBaseIcons = () => {
    const icons = [];

    if (bot.kb.pdf?.length) {
      icons.push(
        <div key="pdf" className="flex items-center gap-1">
          <FileText className="w-3 h-3 text-red-500" />
          <span>{bot.kb.pdf.length}</span>
        </div>
      );
    }

    if (bot.kb.csv?.length) {
      icons.push(
        <div key="csv" className="flex items-center gap-1">
          <Database className="w-3 h-3 text-green-500" />
          <span>{bot.kb.csv.length}</span>
        </div>
      );
    }

    if (bot.kb.web_url?.length) {
      icons.push(
        <div key="web" className="flex items-center gap-1">
          <Globe className="w-3 h-3 text-blue-500" />
          <span>{bot.kb.web_url.length}</span>
        </div>
      );
    }

    if (bot.kb.json?.length) {
      icons.push(
        <div key="json" className="flex items-center gap-1">
          <FileJson className="w-3 h-3 text-yellow-500" />
          <span>{bot.kb.json.length}</span>
        </div>
      );
    }

    if (bot.kb.txt?.length) {
      icons.push(
        <div key="txt" className="flex items-center gap-1">
          <FileType className="w-3 h-3 text-purple-500" />
          <span>{bot.kb.txt.length}</span>
        </div>
      );
    }

    return icons.length > 0 ? (
      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
        {icons}
      </div>
    ) : (
      <span className="text-xs text-gray-400">No knowledge base</span>
    );
  };

  const chatUrl = `/chat/${bot.id}/${bot.kb?.id}`;

  const handleToggleAccess = async (newAccess: boolean) => {
    setIsUpdating(true);
    try {
      await axios.patch(`${AUTH_BASE_URL}/api/v1/bot/modify-access`, {
        bot_id: bot.id,
        private: newAccess,
      });
      setIsPrivate(newAccess);
      toast.success(`Bot access updated to ${newAccess ? 'Private' : 'Public'}`);
    } catch (error) {
      toast.error('Failed to update bot access');
      console.error('Failed to update access', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}${chatUrl}`)
      .then(() => {
        toast.success('Link copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy link.');
      });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div
      className={`
        min-h-64 w-full rounded-2xl border-2 p-5 flex flex-col justify-between
        shadow-sm transition hover:shadow-lg bg-white
        ${getThemeColors(bot.theme)}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(
            bot.theme
          )}`}
        >
          {bot.profile_image ? (
            <img
              src={bot.profile_image}
              alt={bot.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <Bot className="w-5 h-5" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-full text-xs text-gray-600 border">
            <Cpu className="w-3 h-3" />
            {bot.model}
          </div>

          <TooltipProvider>
            <Tooltip>
              <DropdownMenu>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="hover:bg-gray-200 p-1 rounded-full">
                      <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-sm">
                  Bot settings
                </TooltipContent>

                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <button
                      onClick={() => handleToggleAccess(!isPrivate)}
                      disabled={isUpdating}
                      className="w-full text-left text-sm"
                    >
                      {isPrivate ? 'Make Public' : 'Make Private'}
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={handleCopyLink}
                      disabled={isPrivate || isUpdating}
                      className="w-full text-left text-sm flex items-center gap-2"
                    >
                      <Share className="w-4 h-4" />
                      Share
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 truncate">
        {bot.name || 'Untitled Bot'}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 mt-1 h-10 overflow-hidden leading-snug line-clamp-2">
        {bot.description && truncateDescription(bot.description)}
      </p>

      {/* KB */}
      <div className="mt-2">{renderKnowledgeBaseIcons()}</div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 text-xs text-gray-600">
        <span>Temp: {bot.temperature ?? 0.7}</span>
        <span
          className={`px-2 py-0.5 rounded-full font-medium ${
            isPrivate
              ? 'bg-orange-100 text-orange-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {isPrivate ? 'Private' : 'Public'}
        </span>
      </div>

      {/* Chat Button */}
      <div className="mt-4">
        <Link href={chatUrl}>
          <Button className="w-full text-sm gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </Button>
        </Link>
      </div>
    </div>
  );
};

export { BotCard };
