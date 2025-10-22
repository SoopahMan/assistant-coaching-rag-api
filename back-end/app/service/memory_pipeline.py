from config.database import SessionLocal
from app.model.chat_message import ChatMessage
from app.model.chat_session import ChatSession

class ConversationMemory:
    def __init__(self):
        self.db = SessionLocal()

    def create_session(self, user_id: str, title: str = None):
        """Buat sesi chat baru"""
        session = ChatSession(user_id=user_id, title=title)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session.id

    def get_user_sessions(self, user_id: str):
        """Ambil semua sesi chat user"""
        return (
            self.db.query(ChatSession)
            .filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.created_at.desc())
            .all()
        )

    def add_message(self, session_id: int, role: str, message: str):
        """Simpan pesan ke dalam sesi"""
        new_msg = ChatMessage(session_id=session_id, role=role, message=message)
        self.db.add(new_msg)
        self.db.commit()

    def get_context(self, session_id: int, limit: int = 5):
        """Ambil konteks (riwayat chat) dari sesi tertentu"""
        msgs = (
            self.db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
            .all()
        )
        msgs.reverse()
        return [{"role": m.role, "content": m.message} for m in msgs]

    def delete_session(self, session_id: int):
        """Hapus sesi (beserta semua pesannya)"""
        session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            self.db.delete(session)
            self.db.commit()
