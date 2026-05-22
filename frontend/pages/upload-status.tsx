import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/useSession";
import styles from "../styles/upload-status.module.css";

export default function UploadStatusPage() {
  const { user } = useSession();
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchUploads();
  }, [user]);

  const fetchUploads = async () => {
    try {
      const response = await fetch("/api/materials/uploads");
      if (!response.ok) throw new Error("Failed to fetch uploads");
      const data = await response.json();
      setUploads(data);
    } catch (err) {
      setError("Failed to load uploads");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700">Please log in to view upload status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Status</h1>
        
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
            {uploads.length === 0 ? (
              <div className="bg-white shadow-sm rounded-md p-6 text-gray-500 text-center">
                No uploads yet. Go to the upload page to add your first study material.
              </div>
            ) : (
              uploads.map((upload) => (
                <div key={upload.id} className="bg-white shadow-sm rounded-md p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{upload.original_filename}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Uploaded {new Date(upload.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        upload.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        upload.status === "processing" ? "bg-blue-100 text-blue-800" :
                        upload.status === "completed" ? "bg-green-100 text-green-800" :
                        upload.status === "failed" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {upload.status}
                      </span>
                    </div>
                  </div>
                  {upload.status === "failed" && (
                    <p className="mt-3 text-sm text-red-600">
                      Error: {upload.error_message || "Unknown error occurred during processing"}
                    </p>
                  )}
                  {upload.status === "completed" && (
                    <p className="mt-3 text-sm text-green-600">
                      Successfully processed! Material ID: {upload.material_id}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}