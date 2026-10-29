import { NextPage } from "next";
import Link from "next/link";
import { ArrowLeft, Terminal } from "lucide-react";

const NotFound: NextPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
      <main className="bg-white border border-zinc-200 rounded-xl shadow-xs p-8 max-w-md w-full text-left">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-600 mb-6">
          <Terminal className="w-3.5 h-3.5" />
          <span>ERR_BOT_NOT_FOUND · 404</span>
        </div>

        <h1 className="text-xl font-semibold text-zinc-950 tracking-tight mb-2">
          Assistant unavailable
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed mb-6">
          The assistant you requested does not exist, has been set to private, or its knowledge base was removed.
        </p>

        <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Workspace
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;