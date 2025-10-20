import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import apiUrl from '@/config/api'
import { Divider, message } from 'antd'
import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import ListDocument from '../document'
import FileUpload from '../file-upload'
import { Clipboard, ClipboardCheck } from 'lucide-react'
import LogoutButton from '@/components/ui/logout'
import BackButton from '@/components/ui/back'
import { Link } from 'react-router-dom'


export default function Home() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshList, setRefreshList] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const chatContainerRef = useRef(null)

  const copyToClipboard = async (text, index) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleSend = async () => {
    if (!input.trim()) return
    setIsLoading(true)

    try {
      const res = await apiUrl.post('/ask', { question: input })
      const data = res.data

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: input },
        { role: 'assistant', content: data.answer[0] },
      ])
      setInput('')
    } catch (err) {
      setMessages((prev) => [...prev, 'Error fetching response'])
      console.log('err', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearResult = () => {
    if (window.confirm('Are you sure you want to clear all chat messages?')) {
      setMessages([])
      message.success('Chat cleared successfully')

      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = 0
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.altKey) {
      e.preventDefault()
      e.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
    <header
      className="sticky top-0 z-50 flex w-full items-center justify-between border-b bg-white px-4 py-3 shadow-sm"
    >
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
          <div className="md:col-span-4 bg-white p-4 rounded shadow overflow-auto">
            <FileUpload setRefreshList={setRefreshList} />
            <Divider />
            <ListDocument refreshList={refreshList} />
          </div>

          <div className="md:col-span-8 bg-white p-4 rounded shadow flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Chatbot</h4>
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

            {/* Chat messages scrollable */}
            <div
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
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-4 [&_br]:block [&_br]:mb-4">
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
                  Loading...
                </div>
              )}
            </div>

            {/* Fixed form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="mt-4 flex gap-2 items-end sticky bottom-0 bg-white pt-2"
            >
              <Textarea
                className="flex-1"
                placeholder="Type your message here... Use Alt + Enter shortcut to submit form"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="submit"
                disabled={isLoading}
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
