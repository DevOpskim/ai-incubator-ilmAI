import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/useSession";

export default function MaterialsPage() {
  const { user, loading: sessionLoading } = useSession();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchMaterials();
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

  if (sessionLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-b-gray-900"></div></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700">Please log in to view your materials</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Materials</h1>
          <Link
            href="/upload"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
          >
            + Upload New
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
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
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{material.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Uploaded {new Date(material.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">Topic: {material.topic?.name || "Uncategorized"}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}