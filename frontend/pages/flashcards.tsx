import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/useSession";
import Header from "@/components/Header";

type Flashcard = {
  id: string;
  front: string;
  back: string;
};

type DueCard = {
  flashcard: Flashcard;
  review_queue_id: string;
  due_at: string;
  interval_days: number;
  repetitions: number;
  ease_factor: number;
};

export default function FlashcardsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [finished, setFinished] = useState(false);

  const fetchDueCards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/flashcards/due");
      if (res.ok) {
        const data = await res.json();
        setDueCards(data);
        setCurrentIndex(0);
        setFlipped(false);
        setFinished(data.length === 0);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchDueCards();
  }, [user]);

  const generateCards = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10 }),
      });
      if (res.ok) {
        await fetchDueCards();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Failed to generate flashcards");
      }
    } catch {
      setError("Network error — is the backend running?");
    }
    setGenerating(false);
  };

  const rateCard = async (quality: number) => {
    const card = dueCards[currentIndex];
    if (!card) return;

    try {
      await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_queue_id: card.review_queue_id, quality }),
      });
    } catch {}

    setSessionStats((s) => ({
      reviewed: s.reviewed + 1,
      correct: s.correct + (quality >= 3 ? 1 : 0),
    }));
    setFlipped(false);

    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      await fetchDueCards();
      if (dueCards.length <= 1) {
        setFinished(true);
      }
    }
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
        <p className="text-gray-700">Please log in to study flashcards.</p>
      </div></>
    );
  }

  const current = dueCards[currentIndex];

  return (
    <><Header /><div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
          <div className="text-sm text-gray-500">
            {sessionStats.reviewed > 0 && (
              <span className="mr-4">
                {sessionStats.reviewed} reviewed · {sessionStats.correct} correct
              </span>
            )}
            <button
              onClick={generateCards}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {generating ? "Generating..." : "Generate Cards"}
            </button>
          </div>
        </div>

        {generating && (
          <div className="text-center py-12 text-gray-400">
            Generating flashcards from your materials...
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <p className="text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">{error}</p>
          </div>
        )}

        {!generating && finished && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No cards due for review.</p>
            <p className="text-gray-400 text-sm mb-6">
              Generate new cards or check back later for spaced repetition reviews.
            </p>
            <button
              onClick={generateCards}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Generate Flashcards
            </button>
          </div>
        )}

        {!generating && !finished && current && (
          <div>
            <div className="text-sm text-gray-400 mb-4 text-center">
              Card {currentIndex + 1} of {dueCards.length}
            </div>

            <div
              onClick={() => setFlipped(!flipped)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 min-h-[280px] flex items-center justify-center cursor-pointer hover:shadow-md transition"
            >
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
                  {flipped ? "Back" : "Front"}
                </p>
                <p className="text-xl text-gray-900 whitespace-pre-wrap">
                  {flipped ? current.flashcard.back : current.flashcard.front}
                </p>
                {!flipped && (
                  <p className="text-sm text-gray-400 mt-6">Click to reveal answer</p>
                )}
              </div>
            </div>

            {flipped && (
              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={() => rateCard(0)}
                  className="px-5 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
                >
                  Again
                </button>
                <button
                  onClick={() => rateCard(2)}
                  className="px-5 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 text-sm font-medium"
                >
                  Hard
                </button>
                <button
                  onClick={() => rateCard(3)}
                  className="px-5 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium"
                >
                  Good
                </button>
                <button
                  onClick={() => rateCard(5)}
                  className="px-5 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
                >
                  Easy
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div></>
  );
}
