import Link from 'next/link';
import { ArrowRight, Shield, Zap, Users, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-50">
            <Globe className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            <span>OpsConsole</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 text-center lg:py-32">
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-slate-50">
            Realtime Operations Console for{' '}
            <span className="text-blue-600 dark:text-blue-500">Modern Teams</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Manage incidents, track tickets, and collaborate in real-time. Built with strict
            multi-tenancy and enterprise-grade security.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="https://github.com/imehsans/multi-tenent-ass"
              target="_blank"
              className="rounded-lg border border-slate-200 bg-white px-8 py-3 font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
            >
              View Source
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-slate-50 py-24 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-950">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-50">
                  Enterprise Security
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Role-based access control (RBAC), secure multi-tenancy, and audit logs ensure your
                  data stays safe.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-950">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-50">
                  Realtime Updates
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Collaborate live with presence indicators, typing status, and instant updates
                  across all devices.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-950">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-50">
                  Multi-Tenant Organizations
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Create multiple organizations, invite team members, and manage permissions
                  seamlessly.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 dark:border-slate-800">
        <div className="container mx-auto px-4 text-center text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} OpsConsole. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
