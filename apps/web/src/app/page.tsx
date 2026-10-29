'use client';

import React from 'react';
import {
  ArrowRight,
  FileText,
  Database,
  Globe,
  FileJson,
  FileType,
  Share2,
  Cpu,
  Layers,
  Check,
} from 'lucide-react';
import Link from 'next/link';

const KSTMLanding = () => {
  const sources = [
    { label: 'PDF Documents', ext: '.pdf', icon: FileText },
    { label: 'Structured CSV', ext: '.csv', icon: Database },
    { label: 'JSON Schemas', ext: '.json', icon: FileJson },
    { label: 'Plain Text & Notes', ext: '.txt', icon: FileType },
    { label: 'Live Web Pages', ext: 'https://', icon: Globe },
  ];

  const capabilities = [
    {
      step: '01',
      title: 'Multi-format ingestion',
      description:
        'Upload up to three document sources or point the scraper at live documentation URLs. Files are chunked and queued asynchronously via BullMQ.',
      meta: 'PDF · CSV · JSON · TXT · URL',
      icon: Layers,
    },
    {
      step: '02',
      title: 'Graph & vector indexing',
      description:
        'Chunks are embedded and indexed into Neo4j vector storage scoped to an isolated knowledge base ID so context never bleeds across assistants.',
      meta: 'Neo4j Vector · Scoped KB',
      icon: Cpu,
    },
    {
      step: '03',
      title: 'Configurable inference & sharing',
      description:
        'Tune model selection, temperature, custom system prompt templates with {{context}} variables, and toggle between private workspace or public link access.',
      meta: 'Gemini · Access Control · Embed',
      icon: Share2,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-zinc-50/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center font-mono text-xs font-semibold">
                K
              </div>
              <span className="font-semibold text-sm tracking-tight text-zinc-950">
                KSTM
              </span>
              <span className="text-[11px] font-mono text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5 bg-white">
                v1.0
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600">
              <a href="#pipeline" className="hover:text-zinc-950 transition-colors">
                Architecture
              </a>
              <a href="#demo" className="hover:text-zinc-950 transition-colors">
                Walkthrough
              </a>
              <Link href="/usecases" className="hover:text-zinc-950 transition-colors">
                Use Cases
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-950 px-3 py-1.5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-zinc-900 text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5"
            >
              Start building
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-zinc-200 text-xs font-mono text-zinc-600 mb-6 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>RETRIEVAL-GROUNDED ASSISTANTS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-zinc-950 tracking-tight leading-[1.08] mb-6">
              Turn raw documents into scoped AI assistants.
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed mb-8 max-w-2xl">
              Ingest PDFs, CSV tables, JSON files, plain text, or live web pages. KSTM indexes your sources into an isolated knowledge base and serves a shareable chat interface grounded strictly in your data.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-12">
              <Link
                href="/register"
                className="bg-zinc-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors inline-flex items-center gap-2"
              >
                Create an assistant
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="bg-white border border-zinc-200 text-zinc-800 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-zinc-100/80 hover:border-zinc-300 transition-colors"
              >
                Open Workspace
              </Link>
              <Link
                href="/usecases"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 py-2.5 transition-colors"
              >
                Explore 24 templates →
              </Link>
            </div>
          </div>

          {/* Supported Source Formats Strip */}
          <div className="border-t border-zinc-200/80 pt-8">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
              Supported Ingestion Formats
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {sources.map((src) => {
                const Icon = src.icon;
                return (
                  <div
                    key={src.ext}
                    className="bg-white border border-zinc-200/90 rounded-lg px-3.5 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-xs font-medium text-zinc-800 truncate">
                        {src.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 bg-zinc-50 border border-zinc-200/70 px-1.5 py-0.5 rounded ml-2 shrink-0">
                      {src.ext}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Architecture / Pipeline Section */}
        <section id="pipeline" className="border-y border-zinc-200/80 bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Pipeline Architecture
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight">
                  From source files to deployed endpoint
                </h2>
              </div>
              <p className="text-sm text-zinc-500 max-w-md">
                Every assistant runs against its own scoped knowledge base (`kb_id`) with configurable prompt variables and access rules.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {capabilities.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="border border-zinc-200 rounded-xl p-6 bg-zinc-50/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <span className="font-mono text-xs text-zinc-400 border border-zinc-200 bg-white px-2 py-0.5 rounded">
                          STEP {item.step}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-700">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-zinc-950 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-zinc-600 leading-relaxed mb-6">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-zinc-200/70 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-500">
                        {item.meta}
                      </span>
                      <Check className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Video Walkthrough Section */}
        <section id="demo" className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Product Walkthrough
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight">
                See the ingestion & chat workflow
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              Runtime: ~2 min · End-to-end setup
            </span>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm">
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                kstm.app/dashboard/create
              </div>
              <div className="w-10" />
            </div>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-950">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/t4ynNrGij6I?si=hCY3SNSL3pvo1AN1"
                title="KSTM Product Walkthrough"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-zinc-200/80 bg-white py-16">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight mb-1.5">
                Ready to index your first knowledge base?
              </h2>
              <p className="text-sm text-zinc-600">
                Create an account, upload your files or URLs, and test your assistant in the workspace.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/usecases"
                className="border border-zinc-200 bg-white text-zinc-800 text-xs font-medium px-4 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Browse Use Cases
              </Link>
              <Link
                href="/register"
                className="bg-zinc-900 text-white text-xs font-medium px-5 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5"
              >
                Get started
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 bg-zinc-50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-zinc-900 text-white flex items-center justify-center font-mono text-[10px] font-semibold">
              K
            </div>
            <span className="text-xs font-medium text-zinc-700">
              KSTM — Knowledge-Grounded AI Assistants
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <Link href="/usecases" className="hover:text-zinc-900 transition-colors">
              Use Cases
            </Link>
            <Link href="/login" className="hover:text-zinc-900 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-zinc-900 transition-colors">
              Register
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-900 transition-colors">
              Workspace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default KSTMLanding;
