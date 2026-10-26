'use client'

import React from 'react';
import { ArrowRight, Upload, Zap, Share2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const DataMindLanding = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-semibold text-xl text-gray-900">KSTM AI</div>
          <Link href="/login" className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-8">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-600">Not actively maintained</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Build AI assistants
          <br />
          <span className="text-gray-500">with your data</span>
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Upload CSV, PDF, JSON files or connect web sources.
          Get a custom AI assistant in minutes. Share with anyone.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="#demo" className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center group">
            Watch our demo
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/usecases" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:border-gray-400 transition-colors">
            See example
          </Link>
        </div>

        {/* Data Sources */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>CSV</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>PDF</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>JSON</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>Web pages</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Text files</span>
          </div>
        </div>
      </section>

      {/* Video Demo */}
      <section id="demo" className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            See it in action
          </h2>
          <p className="text-gray-600 text-lg">
            Watch how easy it is to create your own AI assistant in minutes
          </p>
        </div>
        <div className="relative w-full aspect-video rounded-xl shadow-2xl overflow-hidden bg-gray-900">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/t4ynNrGij6I?si=hCY3SNSL3pvo1AN1"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Upload className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Upload your data</h3>
              <p className="text-gray-600">
                Drag and drop files or paste URLs. We support 20+ formats including CSV, PDF, JSON, and web pages.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Zap className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AI learns instantly</h3>
              <p className="text-gray-600">
                Our AI processes your data and creates a custom assistant that understands your specific context and domain.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Share2 className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Share anywhere</h3>
              <p className="text-gray-600">
                Get a shareable link, embed on your website, or integrate with your existing tools and workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to build your AI assistant?
          </h2>
          <p className="text-gray-600 mb-8">
            Join 10,000+ users who are already building with their data
          </p>
          <button className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            Get started for free
          </button>
          <div className="mt-4 text-sm text-gray-500">
            No credit card required
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="font-semibold text-gray-900 mb-4 md:mb-0">KSTM AI</div>
          <div className="flex space-x-8 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DataMindLanding;