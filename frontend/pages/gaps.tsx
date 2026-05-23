import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/useSession";
import Header from "@/components/Header";

type GapItem = {
  area: string;
  details: string;
  recommendation?: string;
};

type GapReport = {
  summary: string;
  strengths: GapItem[];
  weaknesses: GapItem[];
  created_at: string;
  updated_at: string;
};

export default function GapsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [report, setReport] = useState<GapReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gaps/report");
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchReport();
  }, [user]);

  const refreshReport = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/gaps/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch {}
    setRefreshing(false);
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return (
      <><Header /><div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-700">Please log in to view your progress.</p>
      </div></>
    );
  }

  return (
    <><Header /><div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Gaps</h1>
          <button
            onClick={refreshReport}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {refreshing ? "Analyzing..." : "Refresh Analysis"}
          </button>
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-400">
            Loading your report...
          </div>
        )}

        {refreshing && (
          <div className="text-center py-12 text-gray-400">
            Analyzing your quiz and flashcard data...
          </div>
        )}

        {!loading && !refreshing && !report && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No report yet.</p>
            <p className="text-gray-400 text-sm mb-6">
              Complete some quizzes and review flashcards to generate a knowledge gap report.
            </p>
            <button
              onClick={refreshReport}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Generate Report
            </button>
          </div>
        )}

        {!loading && !refreshing && report && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
              <p className="text-gray-700 leading-relaxed">{report.summary}</p>
              <p className="text-xs text-gray-400 mt-3">
                Last updated: {new Date(report.updated_at || report.created_at).toLocaleString()}
              </p>
            </div>

            {/* Strengths */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l-green-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Strengths</h2>
              {report.strengths && report.strengths.length > 0 ? (
                <div className="space-y-4">
                  {report.strengths.map((s, i) => (
                    <div key={i}>
                      <h3 className="text-sm font-medium text-green-800">{s.area}</h3>
                      <p className="text-sm text-gray-600 mt-1">{s.details}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No strengths identified yet.</p>
              )}
            </div>

            {/* Weaknesses */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l-red-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Areas to Improve</h2>
              {report.weaknesses && report.weaknesses.length > 0 ? (
                <div className="space-y-4">
                  {report.weaknesses.map((w, i) => (
                    <div key={i}>
                      <h3 className="text-sm font-medium text-red-800">{w.area}</h3>
                      <p className="text-sm text-gray-600 mt-1">{w.details}</p>
                      {w.recommendation && (
                        <p className="text-sm text-blue-600 mt-1">
                          {w.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No weaknesses identified. Great job!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div></>
  );
}
