import Link from 'next/link';
import { ArrowLeft, SearchX, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-100 p-4 shadow-lg dark:bg-blue-900/30">
          <SearchX className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>

        <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">
          Page Not Found
        </h1>

        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          Sorry, we couldn&apos;t find the resource you were looking for. It might have been moved
          or doesn&apos;t exist.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Link>

          <Link
            href="/orgs"
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-offset-gray-900"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
