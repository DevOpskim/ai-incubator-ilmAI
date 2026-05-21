import { useState } from "react";
import { useSession } from "@/app/hooks/useSession";

type Question = {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  source_ref: string;
};

type QuizResult = {
  score: number;
  total: number;
  score_percent: number;
  results: {
    question_id: string;
    question: string;
    selected_index: number;
    correct_index: number;
    is_correct: boolean;
    explanation: string;
    source_ref: string;
  }[];
};

export default function QuizPage() {
  const { user, loading: sessionLoading } = useSession();
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [questionLoading, setQuestionLoading] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const generateQuiz = async () => {
    setQuestionLoading(true);
    setQuestions(null);
    setSelections({});
    setResult(null);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty, count: 5 }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
      }
    } catch {}
    setQuestionLoading(false);
  };

  const submitQuiz = async () => {
    if (!questions) return;
    setSubmitting(true);
    try {
      const answers = questions.map((q) => ({
        question_id: q.id,
        selected_index: selections[q.id] ?? 0,
      }));
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty, questions, answers }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch {}
    setSubmitting(false);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-700">Please log in to take quizzes.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Practice Quiz</h1>

        {!questions && !result && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm mb-6"
            >
              <option value="easy">Gentle Review</option>
              <option value="medium">Solid Understanding</option>
              <option value="hard">Expert Challenge</option>
            </select>
            <button
              onClick={generateQuiz}
              disabled={questionLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {questionLoading ? "Generating..." : "Generate Quiz"}
            </button>
          </div>
        )}

        {questionLoading && (
          <div className="text-center py-12 text-gray-400">
            Generating questions from your materials...
          </div>
        )}

        {questions && !result && (
          <div className="space-y-6">
            {questions.map((q, i) => (
              <div key={q.id} className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-sm text-gray-400 mb-1">Question {i + 1}</p>
                <p className="text-lg font-medium text-gray-900 mb-4">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, j) => (
                    <label
                      key={j}
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition ${
                        selections[q.id] === j
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={selections[q.id] === j}
                        onChange={() =>
                          setSelections((s) => ({ ...s, [q.id]: j }))
                        }
                        className="accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <button
                onClick={submitQuiz}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Answers"}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <p className="text-4xl font-bold text-gray-900 mb-2">
                {result.score_percent}%
              </p>
              <p className="text-gray-500">
                {result.score} of {result.total} correct
              </p>
            </div>

            {result.results.map((r, i) => (
              <div
                key={r.question_id}
                className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
                  r.is_correct ? "border-l-green-500" : "border-l-red-500"
                }`}
              >
                <p className="text-sm text-gray-400 mb-1">Question {i + 1}</p>
                <p className="text-gray-900 font-medium mb-3">{r.question}</p>
                <p className="text-sm text-gray-600 mb-1">
                  Your answer:{" "}
                  <span className={r.is_correct ? "text-green-600" : "text-red-600"}>
                    {r.selected_index !== undefined ? questions?.[i]?.options[r.selected_index] ?? "—" : "—"}
                  </span>
                </p>
                {!r.is_correct && (
                  <p className="text-sm text-green-600 mb-2">
                    Correct answer: {questions?.[i]?.options[r.correct_index]}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">{r.explanation}</p>
                {r.source_ref && (
                  <p className="text-xs text-gray-400 mt-1">Source: {r.source_ref}</p>
                )}
              </div>
            ))}

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setQuestions(null);
                  setResult(null);
                  setSelections({});
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
