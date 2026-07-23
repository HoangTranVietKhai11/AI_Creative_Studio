import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ContentPilot AI — The Ultimate AI Creative Studio',
  description:
    'AI-powered content creation, trend research, and marketing automation for creators, marketers, and brands. Generate viral scripts, analyze trends, optimize SEO, and more.',
  keywords: [
    'AI content creation',
    'social media AI',
    'content marketing',
    'AI copywriting',
    'trend analysis',
    'video script generator',
  ],
  openGraph: {
    title: 'ContentPilot AI',
    description: 'The Ultimate AI Creative Studio for Creators and Marketers',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
