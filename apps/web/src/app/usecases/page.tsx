import React from 'react';
import { ArrowRight, MessageCircle, Headphones, User, BookOpen, TrendingUp, Building, Users, ShoppingCart, FileText, Calendar, Globe, DollarSign, Shield, Briefcase, GraduationCap, Heart, Code, Zap, Search, BarChart3, UserCheck, Clock, Target } from 'lucide-react';
import Link from 'next/link';

const UseCasesPage = () => {
  const useCases = [
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: "Q&A Bot",
      description: "Answer questions from your documentation, FAQs, or knowledge base instantly",
      example: "Upload your product docs → Get instant answers"
    },
    {
      icon: <Headphones className="w-5 h-5" />,
      title: "Customer Support Bot",
      description: "Handle common support queries using your help articles and ticket history",
      example: "Import support tickets → Automate responses"
    },
    {
      icon: <User className="w-5 h-5" />,
      title: "About Me Bot",
      description: "Create a personal AI that knows your bio, experience, and answers about you",
      example: "Upload your resume → Personal assistant"
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Learning Assistant",
      description: "Turn textbooks, courses, or training materials into interactive tutors",
      example: "Upload course content → Study companion"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Sales Assistant",
      description: "Train AI on your product catalog, pricing, and sales materials",
      example: "Import product data → Sales expert"
    },
    {
      icon: <Building className="w-5 h-5" />,
      title: "Company Knowledge Bot",
      description: "Make company policies, procedures, and information easily searchable",
      example: "Upload HR docs → Employee helper"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Research Assistant",
      description: "Upload research papers, articles, or reports for intelligent analysis",
      example: "Import research → Smart insights"
    },
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      title: "Product Recommendation Bot",
      description: "Help customers find products based on your inventory and descriptions",
      example: "Upload catalog → Shopping assistant"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "HR Assistant",
      description: "Answer employee questions about benefits, policies, and procedures",
      example: "Import HR policies → Employee support"
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Event Information Bot",
      description: "Provide event details, schedules, and speaker information automatically",
      example: "Upload event data → Event guide"
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Travel Guide Bot",
      description: "Create personalized travel assistants from destination guides and reviews",
      example: "Import travel guides → Trip planner"
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Financial Advisor Bot",
      description: "Answer questions about financial products, rates, and investment options",
      example: "Upload financial data → Money advisor"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Compliance Bot",
      description: "Help teams understand regulations, policies, and compliance requirements",
      example: "Import regulations → Compliance guide"
    },
    {
      icon: <Briefcase className="w-5 h-5" />,
      title: "Job Interview Bot",
      description: "Practice interviews with AI trained on job descriptions and company info",
      example: "Upload job specs → Interview prep"
    },
    {
      icon: <GraduationCap className="w-5 h-5" />,
      title: "Academic Tutor",
      description: "Create subject-specific tutors from textbooks and lecture notes",
      example: "Upload notes → Personal tutor"
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: "Health Information Bot",
      description: "Provide health info and wellness guidance from medical resources",
      example: "Import health guides → Wellness coach"
    },
    {
      icon: <Code className="w-5 h-5" />,
      title: "Technical Documentation Bot",
      description: "Help developers navigate APIs, codebases, and technical docs",
      example: "Upload tech docs → Dev assistant"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Troubleshooting Bot",
      description: "Diagnose problems using manuals, error logs, and solution databases",
      example: "Import troubleshooting guides → Tech support"
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: "Content Discovery Bot",
      description: "Help users find relevant content from large databases or libraries",
      example: "Upload content library → Smart search"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Data Analysis Bot",
      description: "Get insights and explanations from your spreadsheets and reports",
      example: "Upload data files → Business insights"
    },
    {
      icon: <UserCheck className="w-5 h-5" />,
      title: "Onboarding Assistant",
      description: "Guide new employees or customers through setup and initial steps",
      example: "Create onboarding flow → Welcome guide"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Meeting Assistant",
      description: "Answer questions about past meetings, decisions, and action items",
      example: "Upload meeting notes → Meeting memory"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Goal Tracking Bot",
      description: "Help track progress and provide guidance based on your objectives",
      example: "Define goals → Progress coach"
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Recipe Assistant",
      description: "Create cooking helpers from recipe collections and dietary preferences",
      example: "Upload recipes → Cooking guide"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-semibold text-xl text-gray-900">KSTM AI</div>
          <div className="flex items-center space-x-6">
            <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</a>
            <a href="#" className="text-gray-900 font-medium">Use Cases</a>
            <Link href="/register" className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          What can you build?
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          From customer support to personal assistants, see how teams are using DataMind AI 
          to create intelligent bots with their own data.
        </p>
        <div className="text-sm text-gray-500">
          {useCases.length} use cases and counting
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <div 
              key={index} 
              className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors group cursor-pointer"
            >
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-gray-200 transition-colors">
                  {useCase.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{useCase.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {useCase.description}
                  </p>
                  <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 inline-block">
                    {useCase.example}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to build your use case?
          </h2>
          <p className="text-gray-600 mb-8">
            Don&apos;t see your use case? You can create custom AI assistants for any scenario.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center group">
              Start building
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:border-gray-400 transition-colors">
              Request custom use case
            </button>
          </div>
          <div className="mt-6 text-sm text-gray-500">
            Free to start • No credit card required
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="font-semibold text-gray-900 mb-4 md:mb-0">KSTM AI</div>
          <div className="flex space-x-8 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-900 transition-colors">Home</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Use Cases</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UseCasesPage;