from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routers import auth, chat, flashcard, gaps, materials, plan, quiz, users

app = FastAPI(title="Ilm AI Backend", version="0.1.0")


@app.on_event("startup")
def init_db():
    from app.db.base import Base
    from app.db.session import SessionLocal, engine
    from app.models.tables import FlashcardNoteType

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        for code, label in [("basic", "Basic"), ("basic_reversed", "Basic (reversed)"), ("basic_typed", "Basic (type in the answer)"), ("cloze", "Cloze")]:
            exists = db.query(FlashcardNoteType).filter(FlashcardNoteType.code == code).first()
            if not exists:
                db.add(FlashcardNoteType(code=code, label=label))
        db.commit()
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(materials.router)
app.include_router(chat.router)
app.include_router(quiz.router)
app.include_router(flashcard.router)
app.include_router(gaps.router)
app.include_router(plan.router)
