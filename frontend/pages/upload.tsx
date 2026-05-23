import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/hooks/useSession";
import Header from "@/components/Header";
export default function UploadPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTopics = async () => {
    try {
      const response = await fetch("/api/materials/topics");
      if (!response.ok) throw new Error("Failed to fetch topics");
      const data = await response.json();
      setTopics(data);
    } catch (err) {
      console.error("Error fetching topics:", err);
    }
  };

  useEffect(() => {
    if (user) fetchTopics();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError("Please select a file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (topic) {
      formData.append("topic_id", topic);
    }

    setLoading(true);
    try {
      const response = await fetch("/api/materials/upload", {
        method: "POST",
        headers: {
          // Authorization will be handled by cookie
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(`File uploaded successfully! Material ID: ${data.material_id}`);
        setFile(null);
        // You could redirect to material page or stay here
      } else {
        setError(data.message || "Failed to upload file");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-b-gray-900"></div></div>;

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <><Header /><div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Study Materials</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-md p-6">
          <div className="mb-6">
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <div className="flex items-center border-2 border-gray-300 border-dashed rounded-lg p-6 text-center">
              {file ? (
                <div className="flex flex-col items-center">
                  <p className="text-sm text-gray-600">{file.name}</p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </p>
                  <div className="flex justify-center">
                    <label className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700">
                      Choose file
                      <input
                        type="file"
                        id="file"
                        accept=".pdf,.doc,.docx,.txt,.rtf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    PDF, DOC, DOCX, TXT, RTF (up to 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              Topic (optional)
            </label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="max-w-full rounded-md border border-gray-300 bg-white text-gray-700 text-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 focus:outline-none"
            >
              <option value="">Select a topic (optional)</option>
              {topics.map((topicOption) => (
                <option key={topicOption.value} value={topicOption.value}>
                  {topicOption.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div></>
  );
}