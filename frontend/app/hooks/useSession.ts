import { useState, useEffect } from "react";

type User = { email: string; display_name?: string } | null;

export function useSession() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/users/profile");
        if (response.ok) {
          const data = await response.json();
          const profileUser = data.user || data;
          setUser({
            email: profileUser.email,
            display_name: profileUser.display_name,
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  return { user, loading };
}
