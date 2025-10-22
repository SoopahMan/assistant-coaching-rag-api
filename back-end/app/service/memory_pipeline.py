from config.database import SessionLocal
from app.model.chat_message import ChatMessage
from app.model.chat_session import ChatSession


class ConversationMemory:
    def __init__(self):
        self.db = SessionLocal()

    # 🔹 Buat sesi baru
    def create_session(self, user_id: str, title: str = None):
        session = ChatSession(user_id=user_id, title=title or "Untitled Chat")
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session.id

    # 🔹 Ambil semua sesi chat user
    def get_user_sessions(self, user_id: str):
        return (
            self.db.query(ChatSession)
            .filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.created_at.desc())
            .all()
        )

    # 🔹 Rename session
    def rename_session(self, session_id: int, new_title: str):
        session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            session.title = new_title[:255]
            self.db.commit()

    # 🔹 Tambah pesan + update last_message & auto-rename jika pesan pertama
    def add_message(self, session_id: int, role: str, message: str):
        session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            return None

        # Simpan pesan baru
        new_msg = ChatMessage(session_id=session_id, role=role, message=message)
        self.db.add(new_msg)

        # Update ringkasan pesan terakhir
        session.last_message = message[:500]

        # Jika belum punya judul, jadikan kalimat pertama dari pesan pertama
        if (not session.title) or session.title == "Untitled Chat":
            first_sentence = message.split(".")[0][:60]  # ambil kalimat pertama
            session.title = first_sentence.strip() or "Percakapan Baru"

        self.db.commit()
        return new_msg

    # 🔹 Ambil konteks chat
    def get_context(self, session_id: int, limit: int = 5):
        msgs = (
            self.db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
            .all()
        )
        msgs.reverse()
        return [{"role": m.role, "content": m.message} for m in msgs]

    # 🔹 Hapus seluruh session
    def delete_session(self, session_id: int):
        session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            self.db.delete(session)
            self.db.commit()
