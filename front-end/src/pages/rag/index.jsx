import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import apiUrl from '@/config/api'
import { message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Clipboard, ClipboardCheck } from 'lucide-react'
import LogoutButton from '@/components/ui/logout'
import BackButton from '@/components/ui/back'
import { Link } from 'react-router-dom'
import ChatHistorySidebar from '@/components/layouts/sidebar/ChatHistory' // pastikan pakai versi rename yang tadi

export default function Home() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const chatContainerRef = useRef(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const token = localStorage.getItem('token')

  // 🔹 Ketika session berubah, otomatis ambil pesan lama
  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession)
    }
  }, [selectedSession])

  // 🔹 Ambil pesan dari backend
  const fetchMessages = async (sessionId) => {
    try {
      const res = await apiUrl.get(`/chat/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMessages(res.data.messages || [])
    } catch (err) {
      console.error('Gagal memuat pesan:', err)
    }
  }

  // 🔹 Kirim pertanyaan baru
  const handleSend = async () => {
  if (!input.trim()) return
  setIsLoading(true)

  try {
    let sessionId = selectedSession

    // 🔹 Kalau belum ada session, buat baru
    if (!sessionId) {
      const newChat = await apiUrl.post(
        '/chat/new',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      sessionId = newChat.data.session_id
      setSelectedSession(sessionId)
    }

    // 🔹 Kirim pertanyaan
    const res = await apiUrl.post(
      '/ask',
      { question: input, session_id: sessionId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = res.data

    // Tambahkan ke tampilan
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: input },
      { role: 'assistant', content: data.answer?.[0] || 'Tidak ada jawaban.' },
    ])

    // 🔹 Kalau ini pesan pertama, ubah judul chat
    if (messages.length === 0) {
      await apiUrl.put(
        `/chat/${sessionId}/rename?title=${encodeURIComponent(input)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
    }

    setInput('')
  } catch (err) {
    console.log('err', err)
    message.error('Gagal mengirim pesan')
  } finally {
    setIsLoading(false)
  }
}


  const handleClearResult = () => {
    if (window.confirm('Hapus semua pesan di sesi ini?')) {
      setMessages([])
      message.success('Chat cleared successfully')
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = 0
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.form?.requestSubmit()
    }
  }

  const copyToClipboard = async (text, index) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">
          <Link to="/home-admin" className="hover:text-gray-500 transition-colors">
            RAG Chatbot
          </Link>
        </h1>
        <div className="flex items-center space-x-2">
          <BackButton />
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-80px)]">
          {/* 🔹 Sidebar: Kirim setSelectedSession agar klik sidebar bisa muat chat lama */}
          <div className="md:col-span-4 bg-white p-4 rounded shadow overflow-auto">
            <ChatHistorySidebar
              onSelectSession={(sessionId) => {
                setSelectedSession(sessionId)
                setMessages([]) 
              }}
            />

          </div>

          {/* 🔹 Area chat */}
          <div className="md:col-span-8 bg-white p-4 rounded shadow flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">
                {selectedSession ? 'Chat Aktif' : 'Pilih Riwayat Chat'}
              </h4>
              {messages.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClearResult}
                  className="cursor-pointer"
                >
                  Clear Result
                </Button>
              )}
            </div>

            {/* Chat messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto space-y-4 pr-1"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === 'assistant' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`relative max-w-[75%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-gray-300 text-gray-900 rounded-bl-none'
                        : 'bg-gray-100 text-gray-900 rounded-br-none'
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(msg.content, idx)}
                        className="absolute -top-2 -right-8 p-1 text-gray-500 hover:text-gray-700"
                      >
                        {copiedIndex === idx ? (
                          <ClipboardCheck size={16} />
                        ) : (
                          <Clipboard size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="text-sm text-muted-foreground italic">
                  Asisten sedang berpikir...
                </div>
              )}
            </div>

            {/* Input area */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="mt-4 flex gap-2 items-end sticky bottom-0 bg-white pt-2"
            >
              <Textarea
                className="flex-1"
                placeholder={
                  selectedSession
                    ? 'Ketik pesan untuk melanjutkan percakapan...'
                    : 'Pilih riwayat chat atau buat baru di sidebar'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading || !selectedSession}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="submit"
                disabled={isLoading || !selectedSession}
                className="cursor-pointer"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
