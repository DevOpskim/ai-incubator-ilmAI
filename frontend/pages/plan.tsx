import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/useSession";
import Header from "@/components/Header";

type PlanDay = {
  day: number;
  title: string;
  tasks: string[];
  materials: string[];
};

type Plan = {
  goal: { description: string; target_date: string | null };
  summary: string;
  days: PlanDay[];
  created_at: string;
};

export default function PlanPage() {
  const { user, loading: sessionLoading } = useSession();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [goalDesc, setGoalDesc] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plan/current");
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchPlan();
  }, [user]);

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/plan/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: goalDesc,
          target_date: targetDate || null,
          daily_minutes: 30,
        }),
      });
      if (res.ok) {
        setShowGoalForm(false);
        setGoalDesc("");
        setTargetDate("");
      }
    } catch {}
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/plan/generate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch {}
    setGenerating(false);
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
        <p className="text-gray-700">Please log in to view your learning plan.</p>
      </div></>
    );
  }

  return (
    <><Header /><div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Learning Plan</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
            >
              {showGoalForm ? "Cancel" : "Set Goal"}
            </button>
            <button
              onClick={generatePlan}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {generating ? "Generating..." : "Generate Plan"}
            </button>
          </div>
        </div>

        {showGoalForm && (
          <form onSubmit={createGoal} className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Set a Learning Goal</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What do you want to learn?
              </label>
              <textarea
                value={goalDesc}
                onChange={(e) => setGoalDesc(e.target.value)}
                placeholder="e.g., Master Python data structures and algorithms"
                required
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target date (optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={!goalDesc.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              Save Goal
            </button>
          </form>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-400">Loading your plan...</div>
        )}

        {generating && (
          <div className="text-center py-12 text-gray-400">
            Creating your personalized study plan...
          </div>
        )}

        {!loading && !generating && !plan && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No learning plan yet.</p>
            <p className="text-gray-400 text-sm mb-6">
              Set a goal and generate a personalized day-by-day study plan.
            </p>
          </div>
        )}

        {!loading && !generating && plan && (
          <div className="space-y-6">
            {/* Goal + Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Goal</h2>
              <p className="text-gray-700 mb-1">{plan.goal.description}</p>
              {plan.goal.target_date && (
                <p className="text-sm text-gray-400">
                  Target: {new Date(plan.goal.target_date).toLocaleDateString()}
                </p>
              )}
              <p className="text-gray-700 mt-4 leading-relaxed">{plan.summary}</p>
            </div>

            {/* Day-by-day plan */}
            <div className="space-y-3">
              {plan.days.map((d) => (
                <div
                  key={d.day}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedDay(expandedDay === d.day ? null : d.day)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 text-left"
                  >
                    <div>
                      <span className="text-sm text-gray-400 font-mono mr-3">
                        Day {d.day}
                      </span>
                      <span className="text-gray-900 font-medium">{d.title}</span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedDay === d.day ? "rotate-180" : ""
                      }`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expandedDay === d.day && (
                    <div className="px-6 pb-4 space-y-3">
                      <ul className="space-y-2">
                        {d.tasks.map((task, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700">
                            <span className="text-blue-500 mt-0.5">•</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                      {d.materials.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs text-gray-400 mb-1">Materials:</p>
                          <div className="flex flex-wrap gap-2">
                            {d.materials.map((m, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div></>
  );
}
