import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'AutoQA Agent | AI-Powered E2E & QA Testing Automation',
  description: 'Automated QA testing agent powered by Google Gemini, GitHub API, Browserbase Cloud Playwright execution, and Clerk Authentication.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
