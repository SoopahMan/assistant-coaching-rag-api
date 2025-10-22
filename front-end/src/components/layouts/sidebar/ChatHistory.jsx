import { useEffect, useState } from 'react'
import { Button, Input, message } from 'antd'
import { Plus, Trash2, Edit3, Check } from 'lucide-react'
import apiUrl from '@/config/api'

export default function ChatHistorySidebar({ onSelectSession }) {
  const [chats, setChats] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      const res = await apiUrl.get('/chat/list', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setChats(res.data)
    } catch (err) {
      console.error('Gagal memuat riwayat chat:', err)
    }
  }

  const handleNewChat = async () => {
    try {
      const res = await apiUrl.post('/chat/new', null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const newSessionId = res.data.session_id

      message.success('Chat baru dibuat')
      await fetchChats()
      onSelectSession(newSessionId) // langsung buka chat baru
    } catch (err) {
      console.error('Gagal membuat chat baru:', err)
      message.error('Gagal membuat chat baru')
    }
  }

  const handleDeleteChat = async (id) => {
    if (!window.confirm('Yakin ingin menghapus chat ini?')) return
    try {
      await apiUrl.delete(`/chat/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      message.success('Chat dihapus')
      setChats((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Gagal menghapus chat:', err)
      message.error('Gagal menghapus chat')
    }
  }

  const handleRenameChat = async (id) => {
    try {
      await apiUrl.put(
        `/chat/${id}/rename`,
        { new_title: newTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      message.success('Judul chat diperbarui')
      setEditingId(null)
      fetchChats()
    } catch (err) {
      console.error('Gagal rename:', err)
      message.error('Gagal mengganti nama chat')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">Riwayat Chat</h3>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={handleNewChat}
          className="bg-blue-600 text-white"
        >
          Baru
        </Button>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1">
        {chats.length === 0 && (
          <p className="text-gray-500 italic text-sm">Belum ada riwayat chat</p>
        )}

        {chats.map((chat) => (
          <div
            key={chat.id}
            className="group flex justify-between items-center bg-gray-50 hover:bg-gray-100 rounded px-3 py-2 cursor-pointer transition"
            onClick={() => onSelectSession(chat.id)}
          >
            <div className="flex-1 truncate">
              {editingId === chat.id ? (
                <Input
                  size="small"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onPressEnter={() => handleRenameChat(chat.id)}
                  onBlur={() => setEditingId(null)}
                  autoFocus
                />
              ) : (
                <p className="text-sm font-medium text-gray-700 truncate">
                  {chat.title}
                </p>
              )}
              <p className="text-xs text-gray-400 truncate">{chat.last_message}</p>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
              {editingId === chat.id ? (
                <Check
                  size={16}
                  className="text-green-600 cursor-pointer"
                  onClick={() => handleRenameChat(chat.id)}
                />
              ) : (
                <Edit3
                  size={16}
                  className="text-gray-500 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingId(chat.id)
                    setNewTitle(chat.title)
                  }}
                />
              )}
              <Trash2
                size={16}
                className="text-red-500 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteChat(chat.id)
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
