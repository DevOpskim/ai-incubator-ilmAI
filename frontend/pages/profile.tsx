import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/useSession";
import styles from "../styles/profile.module.css";

export default function ProfilePage() {
  const { user } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/users/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError("Failed to load profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-site bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-site bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-b-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-site bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="bg-white shadow-sm rounded-md p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.email}</h2>
              <p className="text-sm text-gray-500">Member since {new Date().getFullYear()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Email</span>
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Display Name</span>
              <span className="font-medium text-gray-900">{profile?.display_name || "Not set"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Preferred Language</span>
              <span className="font-medium text-gray-900">{profile?.preferred_language || "English"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Learning Goal</span>
              <span className="font-medium text-gray-900">{profile?.goal || "Not set"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}