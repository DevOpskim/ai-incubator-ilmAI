import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/useSession";
import Header from "@/components/Header";

type FolderTreeNode = {
  id: string;
  name: string;
  parent_id: string | null;
  children: FolderTreeNode[];
  materials: { id: string; title: string }[];
};

type Deck = {
  id: string;
  name: string;
  description: string | null;
  folder_id: string | null;
  card_count: number;
  created_at: string;
};

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
  const [decks, setDecks] = useState<Deck[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [renamingDeck, setRenamingDeck] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Deck detail view
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);
  const [generating, setGenerating] = useState(false);

  // Review mode
  const [reviewMode, setReviewMode] = useState(false);
  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchDecks();
    fetchFolderTree();
  }, [user]);

  const fetchDecks = async () => {
    try {
      const res = await fetch("/api/decks/");
      if (res.ok) setDecks(await res.json());
    } catch {}
    setLoading(false);
  };

  const fetchFolderTree = async () => {
    try {
      const res = await fetch("/api/folders/tree");
      if (res.ok) setFolderTree(await res.json());
    } catch {}
  };

  const fetchDeckCards = async (deckId: string) => {
    try {
      const res = await fetch(`/api/decks/${deckId}`);
      if (res.ok) {
        const data = await res.json();
        setDeckCards(data.flashcards || []);
      }
    } catch {}
  };

  const fetchDueCards = async () => {
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
  };

  const filteredDecks = selectedFolderId
    ? decks.filter((d) => d.folder_id === selectedFolderId)
    : decks;

  const createDeck = async () => {
    if (!newDeckName.trim()) return;
    try {
      const res = await fetch("/api/decks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDeckName.trim(),
          folder_id: selectedFolderId || null,
        }),
      });
      if (res.ok) {
        setNewDeckName("");
        setShowNewDeck(false);
        fetchDecks();
      }
    } catch {}
  };

  const renameDeck = async (deckId: string) => {
    if (!renameValue.trim()) return;
    try {
      const res = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (res.ok) {
        setRenamingDeck(null);
        fetchDecks();
      }
    } catch {}
  };

  const deleteDeck = async (deck: Deck) => {
    if (!confirm(`Delete deck "${deck.name}" and all its cards?`)) return;
    try {
      const res = await fetch(`/api/decks/${deck.id}`, { method: "DELETE" });
      if (res.ok) {
        if (activeDeck?.id === deck.id) setActiveDeck(null);
        fetchDecks();
      }
    } catch {}
  };

  const openDeck = async (deck: Deck) => {
    setActiveDeck(deck);
    await fetchDeckCards(deck.id);
    setReviewMode(false);
    setFinished(false);
  };

  const generateCards = async () => {
    if (!activeDeck) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/decks/${activeDeck.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10 }),
      });
      if (res.ok) {
        const data = await res.json();
        setDeckCards(data.flashcards || []);
        fetchDecks();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Failed to generate flashcards");
      }
    } catch {
      setError("Network error");
    }
    setGenerating(false);
  };

  const startReview = async () => {
    setReviewMode(true);
    setFinished(false);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionStats({ reviewed: 0, correct: 0 });
    await fetchDueCards();
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
      if (dueCards.length <= 1) setFinished(true);
    }
  };

  const moveDeck = async (deckId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/decks/${deckId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
      if (res.ok) fetchDecks();
    } catch {}
  };

  const renderFolderTree = (nodes: FolderTreeNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm ${
            selectedFolderId === node.id
              ? "bg-blue-100 text-blue-800"
              : "hover:bg-gray-100"
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <span className="text-gray-400 shrink-0">📁</span>
          <span className="flex-1 truncate" onClick={() => setSelectedFolderId(node.id)}>
            {node.name}
          </span>
        </div>
        {node.children.length > 0 && renderFolderTree(node.children, depth + 1)}
      </div>
    ));
  };

  if (sessionLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-b-gray-900"></div></div>;

  if (!user) return <><Header /><div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-700">Please log in to study flashcards.</p></div></>;

  // Review mode
  if (reviewMode) {
    const current = dueCards[currentIndex];
    if (finished) {
      return (
        <><Header /><div className="min-h-screen bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">Session complete!</p>
              <p className="text-gray-400 text-sm mb-2">
                {sessionStats.reviewed} reviewed · {sessionStats.correct} correct
              </p>
              <button onClick={() => { setReviewMode(false); setActiveDeck(null); }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Back to Decks
              </button>
            </div>
          </div>
        </div></>
      );
    }
    if (!current) {
      return (
        <><Header /><div className="min-h-screen bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="text-center py-12">
              <p className="text-gray-500">No cards due for review.</p>
              <button onClick={() => { setReviewMode(false); }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Back to Decks
              </button>
            </div>
          </div>
        </div></>
      );
    }
    return (
      <><Header /><div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Reviewing: {activeDeck?.name}</h1>
            <div className="text-sm text-gray-500">
              {sessionStats.reviewed} reviewed · {sessionStats.correct} correct
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-4 text-center">
            Card {currentIndex + 1} of {dueCards.length}
          </div>
          <div onClick={() => setFlipped(!flipped)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 min-h-[280px] flex items-center justify-center cursor-pointer hover:shadow-md transition">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
                {flipped ? "Back" : "Front"}
              </p>
              <p className="text-xl text-gray-900 whitespace-pre-wrap">
                {flipped ? current.flashcard.back : current.flashcard.front}
              </p>
              {!flipped && <p className="text-sm text-gray-400 mt-6">Click to reveal answer</p>}
            </div>
          </div>
          {flipped && (
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => rateCard(0)}
                className="px-5 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium">Again</button>
              <button onClick={() => rateCard(2)}
                className="px-5 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 text-sm font-medium">Hard</button>
              <button onClick={() => rateCard(3)}
                className="px-5 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium">Good</button>
              <button onClick={() => rateCard(5)}
                className="px-5 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium">Easy</button>
            </div>
          )}
        </div>
      </div></>
    );
  }

  // Deck detail view
  if (activeDeck) {
    return (
      <><Header /><div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button onClick={() => setActiveDeck(null)}
                className="text-sm text-blue-600 hover:text-blue-800 mb-1">&larr; Back to Decks</button>
              <h1 className="text-3xl font-bold text-gray-900">{activeDeck.name}</h1>
              {activeDeck.description && (
                <p className="text-gray-500 mt-1">{activeDeck.description}</p>
              )}
              <p className="text-sm text-gray-400 mt-1">{deckCards.length} cards</p>
            </div>
            <div className="flex gap-3">
              <button onClick={startReview}
                disabled={deckCards.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
                Study Now
              </button>
              <button onClick={generateCards} disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">
                {generating ? "Generating..." : "Generate Cards"}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">{error}</div>
          )}
          {deckCards.length === 0 && !generating ? (
            <div className="text-center py-12 bg-white rounded-md shadow-sm">
              <p className="text-gray-500 mb-4">No cards in this deck yet.</p>
              <button onClick={generateCards}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Generate Flashcards
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {deckCards.map((card, i) => (
                <div key={card.id} className="bg-white rounded-md shadow-sm p-4">
                  <div className="flex gap-4">
                    <span className="text-sm text-gray-400 font-mono w-8 shrink-0 pt-1">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">{card.front}</p>
                      <p className="text-sm text-gray-500 whitespace-pre-wrap">{card.back}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div></>
    );
  }

  // Deck list view
  return (
    <><Header /><div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Flashcard Decks</h1>
          <button onClick={() => setShowNewDeck(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition">
            + New Deck
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">{error}</div>
        )}

        <div className="flex gap-6">
          {/* Folder sidebar */}
          <div className="w-64 shrink-0">
            <div className="bg-white shadow-sm rounded-md p-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Folders</h2>
              <div className={`px-2 py-1.5 rounded-md cursor-pointer text-sm mb-1 ${
                !selectedFolderId ? "bg-blue-100 text-blue-800 font-medium" : "hover:bg-gray-100"
              }`} onClick={() => setSelectedFolderId(null)}>
                📁 All Decks
              </div>
              {folderTree.length > 0 && renderFolderTree(folderTree)}
            </div>
          </div>

          {/* Deck list */}
          <div className="flex-1 min-w-0">
            {showNewDeck && (
              <div className="mb-6 bg-white shadow-sm rounded-md p-4">
                <input value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="Deck name"
                  onKeyDown={(e) => { if (e.key === "Enter") createDeck(); if (e.key === "Escape") { setShowNewDeck(false); setNewDeckName(""); } }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus />
                <div className="flex gap-2 mt-2">
                  <button onClick={createDeck} disabled={!newDeckName.trim()}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">Create</button>
                  <button onClick={() => { setShowNewDeck(false); setNewDeckName(""); }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-b-gray-900"></div>
              </div>
            ) : filteredDecks.length === 0 ? (
              <div className="bg-white shadow-sm rounded-md p-12 text-center">
                <p className="text-gray-500 mb-4">No decks yet.</p>
                <button onClick={() => setShowNewDeck(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Create Your First Deck
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredDecks.map((deck) => (
                  <div key={deck.id}
                    onClick={() => openDeck(deck)}
                    className="bg-white shadow-sm rounded-md p-5 hover:shadow-md transition cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                        {renamingDeck === deck.id ? (
                          <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => renameDeck(deck.id)}
                            onKeyDown={(e) => e.key === "Enter" && renameDeck(deck.id)}
                            className="w-full border rounded px-2 py-0.5 text-sm"
                            autoFocus
                            onClick={(e) => e.stopPropagation()} />
                        ) : (
                          deck.name
                        )}
                      </h3>
                      <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
                        <button onClick={(e) => { e.stopPropagation(); setRenamingDeck(deck.id); setRenameValue(deck.name); }}
                          className="hover:text-yellow-600" title="Rename">✎</button>
                        <select
                          value={deck.folder_id || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => moveDeck(deck.id, e.target.value || null)}
                          className="text-xs border rounded px-1 py-0.5 text-gray-500">
                          <option value="">No folder</option>
                          {folderTree.flatMap(n => {
                            const flatten = (node: FolderTreeNode): FolderTreeNode[] => [node, ...node.children.flatMap(flatten)];
                            return flatten(n);
                          }).map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                        <button onClick={(e) => { e.stopPropagation(); deleteDeck(deck); }}
                          className="hover:text-red-600" title="Delete">✕</button>
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{deck.card_count} cards</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div></>
  );
}
