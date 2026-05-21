import Link from "next/link";
import { useSession } from "@/app/hooks/useSession";

export default function Header() {
  const { user, loading } = useSession();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      // fallback
      window.location.href = "/";
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Ilm AI
          </Link>
          <nav className="flex items-center gap-4">
            {loading ? null : user ? (
              <>
                <Link
                  href="/chat"
                  className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition"
                >
                  AI Mentor
                </Link>
                <Link
                  href="/materials"
                  className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition"
                >
                  Materials
                </Link>
                <Link
                  href="/upload"
                  className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition"
                >
                  Upload
                </Link>
                <Link
                  href="/flashcards"
                  className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition"
                >
                  Flashcards
                </Link>
                <Link
                  href="/quiz"
                  className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition"
                >
                  Quiz
                </Link>
                <Link
                  href="/plan"
                  className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition"
                >
                  Plan
                </Link>
                <Link
                  href="/gaps"
                  className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition"
                >
                  Progress
                </Link>
                <Link
                  href="/upload-status"
                  className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition"
                >
                  Upload Status
                </Link>
                <Link
                  href="/profile"
                  className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:text-red-800 hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
