import { Textarea } from '../../ui/textarea'

export default function ChatbotLayout() {
  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">RAG Chatbot</h1>
        <Textarea placeholder="Type your message here." />
      </div>
    </main>
  )
}
