import React, { useState, useEffect } from "react";
import apiUrl from "@/config/api";

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token"); // Ambil token JWT dari localStorage

  useEffect(() => {
    fetchSessions();
  }, []);

  // 🔹 Ambil daftar semua chat session
  async function fetchSessions() {
    try {
      const res = await apiUrl.get("/chat/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data);
    } catch (error) {
      console.error("Gagal memuat sesi chat:", error);
    }
  }

  // 🔹 Buat session baru
  async function createNewChat() {
    try {
      const res = await apiUrl.post(
        "/chat/new",
        { title: "Percakapan Baru" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchSessions(); // refresh daftar chat
      setSelectedSession(res.data.session_id);
      setMessages([]); // kosongkan chat lama
    } catch (error) {
      console.error("Gagal membuat chat:", error);
    }
  }

  // 🔹 Ambil pesan dalam session tertentu
  async function fetchMessages(sessionId) {
    try {
      const res = await apiUrl.get(`/chat/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages || []); // backend return {messages: [...]}
      setSelectedSession(sessionId);
    } catch (error) {
      console.error("Gagal memuat pesan:", error);
    }
  }

  // 🔹 Kirim pertanyaan ke backend (RAG pipeline)
  async function handleSend() {
    if (!question.trim() || !selectedSession) return;
    setLoading(true);

    try {
      // Tambahkan pertanyaan ke UI sementara
      const userMsg = { role: "user", content: question };
      setMessages((prev) => [...prev, userMsg]);

      const res = await apiUrl.post(
        "/ask",
        {
          question: question,
          session_id: selectedSession, // tambahkan session_id agar backend tahu konteks
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const botMsg = {
        role: "assistant",
        content: res.data.answer?.[0] || "Tidak ada jawaban.",
      };

      // Tambahkan jawaban ke tampilan
      setMessages((prev) => [...prev, botMsg]);
      setQuestion("");
    } catch (error) {
      console.error("Gagal mengirim pertanyaan:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Chat List */}
      <div className="w-1/4 bg-white border-r flex flex-col">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="font-bold text-lg">Riwayat Chat</h2>
          <button
            onClick={createNewChat}
            className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-sm"
          >
            + Baru
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-3 cursor-pointer hover:bg-gray-200 ${
                session.id === selectedSession ? "bg-gray-200" : ""
              }`}
              onClick={() => fetchMessages(session.id)}
            >
              {session.title || "Percakapan Baru"}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center">
              Pilih sesi atau buat percakapan baru
            </p>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl max-w-lg ${
                msg.role === "user"
                  ? "bg-blue-100 self-end text-right"
                  : "bg-gray-200 self-start text-left"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <p className="text-gray-500 italic">Asisten sedang berpikir...</p>
          )}
        </div>

        {/* Input Section */}
        <div className="p-4 bg-white border-t flex">
          <input
            className="flex-1 p-2 border rounded-lg"
            placeholder={
              selectedSession
                ? "Ketik pertanyaan..."
                : "Pilih atau buat percakapan baru"
            }
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={!selectedSession || loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !selectedSession}
            className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
