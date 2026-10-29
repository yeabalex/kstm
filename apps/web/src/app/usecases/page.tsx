'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  MessageCircle,
  Headphones,
  User,
  BookOpen,
  TrendingUp,
  Building,
  Users,
  ShoppingCart,
  FileText,
  Calendar,
  Globe,
  DollarSign,
  Shield,
  Briefcase,
  GraduationCap,
  Heart,
  Code,
  Zap,
  Search,
  BarChart3,
  UserCheck,
  Clock,
  Target,
} from 'lucide-react';
import Link from 'next/link';

const UseCasesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const useCases = [
    {
      icon: <Code className="w-4 h-4" />,
      title: 'Technical Documentation Bot',
      category: 'Engineering',
      description: 'Help developers navigate APIs, SDK references, and architecture notes.',
      example: 'OpenAPI JSON + Docs URL → Dev assistant',
    },
    {
      icon: <Zap className="w-4 h-4" />,
      title: 'Troubleshooting & Runbook Bot',
      category: 'Engineering',
      description: 'Diagnose production issues using runbooks, postmortems, and error logs.',
      example: 'Runbook PDFs → Incident responder',
    },
    {
      icon: <MessageCircle className="w-4 h-4" />,
      title: 'Product Q&A Assistant',
      category: 'Support',
      description: 'Answer customer and stakeholder questions directly from your product docs.',
      example: 'Product docs → Instant Q&A',
    },
    {
      icon: <Headphones className="w-4 h-4" />,
      title: 'Customer Support Triage',
      category: 'Support',
      description: 'Handle recurring support questions using help center articles and ticket exports.',
      example: 'Ticket CSV + FAQ PDF → Support agent',
    },
    {
      icon: <Building className="w-4 h-4" />,
      title: 'Internal Knowledge Base',
      category: 'Operations',
      description: 'Make company policies, SOPs, and internal wikis searchable via natural language.',
      example: 'Internal handbooks → Team helper',
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: 'Security & Compliance Guide',
      category: 'Operations',
      description: 'Help teams verify SOC2, GDPR, and vendor security policy requirements.',
      example: 'Compliance PDFs → Audit assistant',
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: 'Literature & Research Synthesis',
      category: 'Research',
      description: 'Query across papers, technical reports, and field notes with grounded citations.',
      example: 'Research PDFs → Synthesis engine',
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      title: 'Tabular Data & Report Analyst',
      category: 'Research',
      description: 'Inspect structured CSV exports, metrics definitions, and quarterly summaries.',
      example: 'CSV datasets → Data Q&A',
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      title: 'Sales Enablement Playbook',
      category: 'Support',
      description: 'Equip reps with instant answers on pricing tiers, battlecards, and SKUs.',
      example: 'Pricing CSV + Deck PDF → Sales copilot',
    },
    {
      icon: <ShoppingCart className="w-4 h-4" />,
      title: 'Catalog & Spec Finder',
      category: 'Support',
      description: 'Match buyer requirements against detailed inventory specs and compatibility tables.',
      example: 'Catalog JSON/CSV → Spec advisor',
    },
    {
      icon: <Users className="w-4 h-4" />,
      title: 'People & Benefits Desk',
      category: 'Operations',
      description: 'Answer employee questions on PTO, benefits enrollment, and expense rules.',
      example: 'HR policy PDF → People desk',
    },
    {
      icon: <UserCheck className="w-4 h-4" />,
      title: 'New Hire Onboarding Guide',
      category: 'Operations',
      description: 'Walk new engineers and operators through first-week setup and tooling.',
      example: 'Onboarding TXT/URL → Setup guide',
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      title: 'Course & Curriculum Tutor',
      category: 'Education',
      description: 'Turn syllabi, lecture transcripts, and reading lists into an interactive study partner.',
      example: 'Lecture notes → Course companion',
    },
    {
      icon: <GraduationCap className="w-4 h-4" />,
      title: 'Exam & Certification Prep',
      category: 'Education',
      description: 'Drill domain concepts and review study guides with temperature-controlled precision.',
      example: 'Study guide PDF → Practice tutor',
    },
    {
      icon: <Search className="w-4 h-4" />,
      title: 'Archive & Library Discovery',
      category: 'Research',
      description: 'Surface specific passages and records across large text or JSON collections.',
      example: 'JSON archive → Semantic index',
    },
    {
      icon: <Clock className="w-4 h-4" />,
      title: 'Meeting & Decision Log',
      category: 'Operations',
      description: 'Query historical meeting notes, architecture decision records (ADRs), and owners.',
      example: 'ADR TXT files → Decision memory',
    },
    {
      icon: <User className="w-4 h-4" />,
      title: 'Portfolio & Resume Representative',
      category: 'Personal',
      description: 'Share an interactive link that answers questions about your background and projects.',
      example: 'Resume PDF + Site URL → Bio bot',
    },
    {
      icon: <Briefcase className="w-4 h-4" />,
      title: 'Role & Interview Briefing',
      category: 'Personal',
      description: 'Prepare for technical or domain interviews using role specs and company briefs.',
      example: 'Job spec + Docs → Prep partner',
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      title: 'Conference & Event Concierge',
      category: 'Support',
      description: 'Share a public link with attendees for session times, tracks, and venue logistics.',
      example: 'Schedule CSV → Event guide',
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      title: 'Policy & Rate Schedule Lookup',
      category: 'Research',
      description: 'Look up fee tables, underwriting rules, and product terms without manual Ctrl+F.',
      example: 'Rate tables CSV → Lookup assistant',
    },
    {
      icon: <Globe className="w-4 h-4" />,
      title: 'Field & Regional Operations Guide',
      category: 'Operations',
      description: 'Compile local regulations, vendor contacts, and logistics into one field assistant.',
      example: 'Regional docs → Field desk',
    },
    {
      icon: <Heart className="w-4 h-4" />,
      title: 'Clinical & Protocol Reference',
      category: 'Research',
      description: 'Navigate standard operating procedures and reference guidelines quickly.',
      example: 'Protocol PDFs → Reference bot',
    },
    {
      icon: <Target className="w-4 h-4" />,
      title: 'OKR & Roadmap Tracker',
      category: 'Operations',
      description: 'Keep teams aligned on quarterly targets, milestones, and deliverables.',
      example: 'Roadmap JSON/CSV → Alignment bot',
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      title: 'Custom Domain Compendium',
      category: 'Personal',
      description: 'Build a specialized reference assistant over any curated set of TXT, PDF, or web links.',
      example: 'Custom files → Domain assistant',
    },
  ];

  const categories = ['All', 'Engineering', 'Support', 'Operations', 'Research', 'Education', 'Personal'];

  const filteredUseCases =
    selectedCategory === 'All'
      ? useCases
      : useCases.filter((u) => u.category === selectedCategory);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-zinc-50/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center font-mono text-xs font-semibold">
                K
              </div>
              <span className="font-semibold text-sm tracking-tight text-zinc-950">
                KSTM
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-6 text-xs font-medium">
              <Link href="/" className="text-zinc-500 hover:text-zinc-950 transition-colors">
                Overview
              </Link>
              <Link href="/usecases" className="text-zinc-950">
                Use Cases
              </Link>
              <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-950 transition-colors">
                Workspace
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
              href="/dashboard/create"
              className="bg-zinc-900 text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5"
            >
              New Assistant
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10 w-full">
        <div className="max-w-2xl">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
            Reference Architectures · {useCases.length} Patterns
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-950 tracking-tight mb-4">
            What you can deploy with KSTM
          </h1>
          <p className="text-base text-zinc-600 leading-relaxed">
            Every assistant combines document or web ingestion with a scoped Neo4j vector index and a customizable system prompt template. Select a pattern below to configure your own.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap mt-8 pt-6 border-t border-zinc-200/80">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white text-zinc-600 border border-zinc-200/80 hover:border-zinc-300 hover:text-zinc-950'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20 w-full flex-1">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUseCases.map((useCase, index) => (
            <Link
              href="/dashboard/create"
              key={index}
              className="bg-white border border-zinc-200/90 rounded-xl p-5 hover:border-zinc-400 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200/80 flex items-center justify-center text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-colors">
                    {useCase.icon}
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {useCase.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-950 mb-1.5 group-hover:text-zinc-900">
                  {useCase.title}
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                  {useCase.description}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-500 bg-zinc-50 border border-zinc-200/60 rounded px-2 py-0.5">
                  {useCase.example}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200/80 bg-white py-14">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950 tracking-tight mb-1">
              Have a custom dataset or internal API schema?
            </h2>
            <p className="text-sm text-zinc-600">
              Combine PDFs, CSVs, JSON, TXT, and web URLs in a single assistant workspace.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/create"
              className="bg-zinc-900 text-white text-xs font-medium px-5 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors inline-flex items-center gap-2"
            >
              Configure Assistant
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 bg-zinc-50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-zinc-900 text-white flex items-center justify-center font-mono text-[10px] font-semibold">
              K
            </div>
            <span className="text-xs font-medium text-zinc-700">KSTM</span>
          </div>
          <div className="flex space-x-6 text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-900 transition-colors">
              Home
            </Link>
            <Link href="/usecases" className="hover:text-zinc-900 transition-colors">
              Use Cases
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

export default UseCasesPage;