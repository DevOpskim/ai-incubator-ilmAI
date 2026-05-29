import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/useSession";
import Header from "@/components/Header";

type Topic = {
  id: string;
  name: string;
};

type FolderTreeNode = {
  id: string;
  name: string;
  parent_id: string | null;
  children: FolderTreeNode[];
  materials: { id: string; title: string }[];
};

type Material = {
  id: string;
  title: string;
  topic_id: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
};

export default function MaterialsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchMaterials();
    fetchTopics();
    fetchFolderTree();
  }, [user]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/materials/materials");
      if (!response.ok) throw new Error("Failed to fetch materials");
      const data = await response.json();
      setMaterials(data);
    } catch (err) {
      setError("Failed to load materials");
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

  const fetchFolderTree = async () => {
    try {
      const response = await fetch("/api/folders/tree");
      if (response.ok) {
        const data = await response.json();
        setFolderTree(data);
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
            ? { ...m, topic_id: topicId || null }
            : m
        )
      );
    } catch {}
  };

  const moveMaterial = async (materialId: string, folderId: string | null) => {
    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
      if (response.ok) {
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === materialId ? { ...m, folder_id: folderId } : m
          )
        );
        fetchFolderTree();
      }
    } catch {}
  };

  const deleteMaterial = async (materialId: string) => {
    if (!confirm("Delete this material? This cannot be undone.")) return;
    try {
      const response = await fetch(`/api/materials/${materialId}`, { method: "DELETE" });
      if (response.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
        fetchFolderTree();
      } else {
        const msg = response.status === 404
          ? "Material not found"
          : response.status === 403
            ? "Not authorized"
            : `Delete failed (${response.status})`;
        setError(msg);
      }
    } catch {
      setError("Failed to delete material");
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const response = await fetch("/api/folders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_id: selectedFolderId || null,
        }),
      });
      if (response.ok) {
        setNewFolderName("");
        setShowNewFolder(false);
        fetchFolderTree();
      }
    } catch {}
  };

  const deleteFolder = async (folderId: string, name: string) => {
    if (!confirm(`Delete folder "${name}"? Materials will move to root.`)) return;
    try {
      const response = await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
      if (response.ok) {
        if (selectedFolderId === folderId) setSelectedFolderId(null);
        fetchFolderTree();
        fetchMaterials();
      }
    } catch {}
  };

  const renameFolder = async (folderId: string) => {
    if (!renameValue.trim()) return;
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (response.ok) {
        setRenamingFolder(null);
        fetchFolderTree();
      }
    } catch {}
  };

  const filteredMaterials = selectedFolderId
    ? materials.filter((m) => m.folder_id === selectedFolderId)
    : materials;

  const renderFolderTree = (nodes: FolderTreeNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm group ${
            selectedFolderId === node.id
              ? "bg-blue-100 text-blue-800"
              : "hover:bg-gray-100"
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <span className="text-gray-400 shrink-0">📁</span>
          {renamingFolder === node.id ? (
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => renameFolder(node.id)}
              onKeyDown={(e) => e.key === "Enter" && renameFolder(node.id)}
              className="flex-1 text-sm border rounded px-1 py-0.5"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="flex-1 truncate"
              onClick={() => setSelectedFolderId(node.id)}
            >
              {node.name}
            </span>
          )}
          <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFolderId(node.id);
                setShowNewFolder(true);
              }}
              className="hover:text-blue-600"
              title="New subfolder"
            >
              +
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRenamingFolder(node.id);
                setRenameValue(node.name);
              }}
              className="hover:text-yellow-600"
              title="Rename"
            >
              ✎
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFolder(node.id, node.name);
              }}
              className="hover:text-red-600"
              title="Delete"
            >
              ✕
            </button>
          </span>
        </div>
        {node.children.length > 0 && renderFolderTree(node.children, depth + 1)}
      </div>
    ));
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
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

        <div className="flex gap-6">
          {/* Folder sidebar */}
          <div className="w-64 shrink-0">
            <div className="bg-white shadow-sm rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Folders</h2>
                <button
                  onClick={() => {
                    setShowNewFolder(true);
                    setSelectedFolderId(null);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  + New
                </button>
              </div>
              <div
                className={`px-2 py-1.5 rounded-md cursor-pointer text-sm mb-1 ${
                  !selectedFolderId
                    ? "bg-blue-100 text-blue-800 font-medium"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setSelectedFolderId(null)}
              >
                📁 All Materials
              </div>
              {showNewFolder && (
                <div className="px-2 pb-2">
                  <input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createFolder();
                      if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); }
                    }}
                    className="w-full text-sm border rounded px-2 py-1"
                    autoFocus
                  />
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={createFolder}
                      disabled={!newFolderName.trim()}
                      className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
                      className="text-xs px-2 py-0.5 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {folderTree.length > 0 && renderFolderTree(folderTree)}
              {folderTree.length === 0 && !showNewFolder && (
                <p className="text-xs text-gray-400 px-2 pt-1">No folders yet</p>
              )}
            </div>
          </div>

          {/* Materials list */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-b-gray-900"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMaterials.length === 0 ? (
                  <div className="bg-white shadow-sm rounded-md p-12 text-center">
                    <p className="text-gray-500 mb-4">
                      {selectedFolderId
                        ? "This folder is empty."
                        : "No materials uploaded yet."}
                    </p>
                    <Link
                      href="/upload"
                      className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
                    >
                      Upload Your First Material
                    </Link>
                  </div>
                ) : (
                  filteredMaterials.map((material) => (
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
        </div>
      </div>
    </div></>
  );
}
