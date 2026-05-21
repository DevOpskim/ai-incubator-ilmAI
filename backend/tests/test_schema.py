from app.db.base import Base
from app.models import tables  # noqa: F401


EXPECTED_TABLES = {
    "users",
    "materials",
    "uploads",
    "topics",
    "sessions",
    "chat_sessions",
    "chat_messages",
    "quizzes",
    "flashcards",
    "review_sessions",
    "review_queue",
    "flashcard_note_types",
    "gaps_reports",
    "goals",
    "subscriptions",
    "material_chunks",
    "learning_plans",
    "registration_otps",
}


def test_core_tables_are_registered():
    table_names = set(Base.metadata.tables.keys())
    assert EXPECTED_TABLES.issubset(table_names)
