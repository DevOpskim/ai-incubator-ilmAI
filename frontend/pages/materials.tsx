import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/useSession";
import Header from "@/components/Header";

type Topic = {
  id: string;
  name: string;
};

export default function MaterialsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [materials, setMaterials] = useState<any[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [showNewTopic, setShowNewTopic] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchMaterials();
    fetchTopics();
  }, [user]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/materials/materials");
      if (!response.ok) throw new Error("Failed to fetch materials");
      const data = await response.json();
      setMaterials(data);
    } catch (err) {
      setError("Failed to load materials");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch("/api/materials/topics");
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
      }
    } catch {}
  };

  const createTopic = async () => {
    if (!newTopicName.trim()) return;
    try {
      const response = await fetch("/api/materials/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTopicName.trim() }),
      });
      if (response.ok) {
        const topic = await response.json();
        setTopics((prev) => [...prev, topic]);
        setNewTopicName("");
        setShowNewTopic(false);
      }
    } catch {}
  };

  const updateTopic = async (materialId: string, topicId: string) => {
    try {
      await fetch(`/api/materials/${materialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: topicId || null }),
      });
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === materialId
            ? { ...m, topic_id: topicId || null, topic: topics.find((t) => t.id === topicId) || null }
            : m
        )
      );
    } catch {}
  };

  const deleteMaterial = async (materialId: string) => {
    if (!confirm("Delete this material? This cannot be undone.")) return;
    try {
      const response = await fetch(`/api/materials/${materialId}`, { method: "DELETE" });
      if (response.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      }
    } catch {
      setError("Failed to delete material");
    }
  };

  if (sessionLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-b-gray-900"></div></div>;

  if (!user) {
    return (
      <><Header /><div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700">Please log in to view your materials</p>
        </div>
      </div></>
    );
  }

  return (
    <><Header /><div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Materials</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewTopic(!showNewTopic)}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition"
            >
              + New Category
            </button>
            <Link
              href="/upload"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
            >
              + Upload New
            </Link>
          </div>
        </div>

        {showNewTopic && (
          <div className="mb-6 bg-white shadow-sm rounded-md p-4 flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="e.g. DevOps, Calculus, Biology..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={createTopic}
              disabled={!newTopicName.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-b-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {materials.length === 0 ? (
              <div className="bg-white shadow-sm rounded-md p-12 text-center">
                <p className="text-gray-500 mb-4">No materials uploaded yet.</p>
                <Link
                  href="/upload"
                  className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
                >
                  Upload Your First Material
                </Link>
              </div>
            ) : (
              materials.map((material) => (
                <div key={material.id} className="bg-white shadow-sm rounded-md p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900 truncate">{material.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Uploaded {new Date(material.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <select
                        value={material.topic_id || ""}
                        onChange={(e) => updateTopic(material.id, e.target.value)}
                        className="text-sm rounded-md border border-gray-300 px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Uncategorized</option>
                        {topics.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => deleteMaterial(material.id)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div></>
  );
}
