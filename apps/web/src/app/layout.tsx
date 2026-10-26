import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import Cog from "@/assets/logo-acme.png"
import Head from "next/head";

const dmSans = DM_Sans({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "KoolSales | AI Sales Bot for Marketplaces",
  icons:{
    icon:"/cog.ico"
  },
  description:
    "KoolSales is an AI-powered, human-like sales chatbot built for social media and marketplace platforms. Designed with Next.js, Tailwind CSS, and Framer Motion, the landing page is sleek, responsive, and optimized for mobile.",
  openGraph: {
    title: "KoolSales | AI Sales Bot for Marketplaces",
    description:
      "KoolSales is an AI-powered, human-like sales chatbot built for social media and marketplace platforms. Designed with Next.js, Tailwind CSS, and Framer Motion, the landing page is sleek, responsive, and optimized for mobile.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: Cog.src, // Update if needed
        width: 1784,
        height: 892,
        alt: "KoolSales AI Bot Preview",
      },
    ],
  },
};


// Viewport configuration
export const viewport: Viewport = {
  themeColor: '#93A5E5', // Theme color for the website
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="relative">
      <head>
        <link rel="icon" href="/img/favicon.ico" sizes="any" />
      </head>
      <body className={clsx(dmSans.className, "antialiased bg-[#EAEEFE]")}>
        
              {children}
      </body>
    </html>
  );
}
