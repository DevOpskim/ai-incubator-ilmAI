import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "@/app/hooks/useSession";
import Header from "@/components/Header";

type Message = {
  id: string;
  role: string;
  content: string;
  citations: { source_ref: string; content_snippet: string }[] | null;
  created_at: string;
};

type Session = {
  id: string;
  title: string | null;
  created_at: string;
};

export default function ChatPage() {
  const { user, loading: sessionLoading } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {}
  };

  const fetchMessages = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {}
  }, []);

  const selectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await fetchMessages(sessionId);
  };

  const createSession = async () => {
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const session: Session = await res.json();
        setSessions((prev) => [session, ...prev]);
        setCurrentSessionId(session.id);
        setMessages([]);
      }
    } catch {}
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentSessionId || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      role: "user",
      content: userMessage,
      citations: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/chat/sessions/${currentSessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempId),
        );
        setMessages((prev) => [
          ...prev,
          { ...data.message, citations: data.cited_sources || null },
        ]);

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, title: s.title || userMessage.slice(0, 80) }
              : s,
          ),
        );
      } else {
        const errData = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, content: `Error: ${errData.detail || errData.error || "Failed to send message"}` }
              : m,
          ),
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, content: "Network error. Please try again." }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  if (sessionLoading) {
    return (
      <><Header /><div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div></>
    );
  }

  if (!user) {
    return (
      <><Header /><div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-700">Please log in to use the AI mentor.</p>
      </div></>
    );
  }

  return (
    <><Header /><div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createSession}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            + New Chat
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => selectSession(s.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                currentSessionId === s.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <p className="truncate font-medium">
                {s.title || "New conversation"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(s.created_at).toLocaleDateString()}
              </p>
            </button>
          ))}
        </nav>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col">
        {currentSessionId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-16">
                  <p className="text-lg font-medium">Ask your AI mentor</p>
                  <p className="text-sm mt-1">
                    Ask questions about your study materials.
                  </p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xl rounded-lg px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.citations && msg.citations.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-gray-400 hover:text-gray-600">
                          Sources ({msg.citations.length})
                        </summary>
                        <ul className="mt-1 space-y-1">
                          {msg.citations.map((c, i) => (
                            <li key={i} className="text-xs text-gray-500">
                              <span className="font-medium">{c.source_ref}</span>
                              <p className="truncate">{c.content_snippet}</p>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <form onSubmit={sendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your AI mentor..."
                  disabled={sending}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg font-medium">Select or create a chat</p>
              <p className="text-sm mt-1">
                Start a new conversation to ask questions about your materials.
              </p>
            </div>
          </div>
        )}
      </main>
    </div></>
  );
}
