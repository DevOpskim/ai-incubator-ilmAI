import json
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models.tables import Quiz as QuizModel
from app.schemas.quiz import GenerateResponse, QuizQuestion
from app.services.llm import generate_text
from app.services.retrieval import search_chunks


def generate_questions(
    user_id: UUID,
    topic_id: UUID | None,
    difficulty: str,
    count: int,
    db: Session,
) -> GenerateResponse:
    try:
        query = f"Generate quiz questions about {'the selected topic' if topic_id else 'my study materials'} at {difficulty} difficulty"
        chunks = search_chunks(query=query, user_id=user_id, db=db, limit=10)
        context = "\n\n".join(
            f"[Source: {c.source_ref or 'unknown'}]\n{c.content}"
            for c in chunks
        )
        if not chunks:
            print(f"QUIZ_DEBUG: search_chunks returned 0 chunks for user {user_id}")
    except Exception as e:
        print(f"QUIZ_DEBUG: search_chunks failed: {e}")
        context = ""

    difficulty_instructions = {
        "easy": "Ask basic recall questions that test surface-level understanding.",
        "medium": "Ask questions that require comprehension and application of concepts.",
        "hard": "Ask challenging questions that require deep analysis and synthesis of multiple concepts.",
    }

    if context:
        prompt = (
            "You are a quiz generator. Generate exactly {count} multiple-choice questions "
            "based on the provided study material context.\n\n"
            "CONTEXT:\n{context}\n\n"
            "DIFFICULTY: {difficulty}\n{difficulty_instruction}\n\n"
            "Return a JSON array of objects with these fields:\n"
            "- question (string)\n"
            "- options (array of 4 strings)\n"
            "- correct_index (integer, 0-3, the index of the correct answer)\n"
            "- explanation (string, why the answer is correct, referencing source)\n"
            "- source_ref (string, the source reference from the context)\n\n"
            "Return ONLY the JSON array, no other text."
        ).format(
            count=count,
            context=context,
            difficulty=difficulty,
            difficulty_instruction=difficulty_instructions.get(difficulty, difficulty_instructions["medium"]),
        )
    else:
        prompt = (
            "You are a quiz generator. Generate exactly {count} multiple-choice questions "
            "about general academic topics.\n\n"
            "DIFFICULTY: {difficulty}\n{difficulty_instruction}\n\n"
            "Return a JSON array of objects with these fields:\n"
            "- question (string)\n"
            "- options (array of 4 strings)\n"
            "- correct_index (integer, 0-3, the index of the correct answer)\n"
            "- explanation (string, why the answer is correct)\n"
            "- source_ref (string, the topic reference)\n\n"
            "Return ONLY the JSON array, no other text."
        ).format(
            count=count,
            difficulty=difficulty,
            difficulty_instruction=difficulty_instructions.get(difficulty, difficulty_instructions["medium"]),
        )

    raw = generate_text(prompt, temperature=0.7, max_tokens=3000)
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    if raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    try:
        questions_data = json.loads(raw)
    except json.JSONDecodeError:
        questions_data = []

    questions = []
    for q in questions_data:
        questions.append(
            QuizQuestion(
                id=str(uuid4()),
                question=q.get("question", ""),
                options=q.get("options", ["", "", "", ""]),
                correct_index=q.get("correct_index", 0),
                explanation=q.get("explanation", ""),
                source_ref=q.get("source_ref", ""),
            )
        )

    return GenerateResponse(questions=questions)


def evaluate_answers(
    user_id: UUID,
    topic_id: UUID | None,
    difficulty: str,
    answers: list[dict],
    questions: list[QuizQuestion],
    db: Session,
) -> dict:
    question_map = {q.id: q for q in questions}

    results = []
    correct_count = 0
    for ans in answers:
        q = question_map.get(ans["question_id"])
        if not q:
            continue
        is_correct = ans["selected_index"] == q.correct_index
        if is_correct:
            correct_count += 1
        results.append({
            "question_id": ans["question_id"],
            "question": q.question,
            "selected_index": ans["selected_index"],
            "correct_index": q.correct_index,
            "is_correct": is_correct,
            "explanation": q.explanation,
            "source_ref": q.source_ref,
        })

    total = len(questions)
    score_percent = round((correct_count / total) * 100, 1) if total > 0 else 0

    quiz = QuizModel(
        id=uuid4(),
        user_id=user_id,
        topic_id=topic_id,
        difficulty=difficulty,
        score_percent=score_percent,
        question_count=total,
    )
    db.add(quiz)
    db.commit()

    return {
        "score": correct_count,
        "total": total,
        "score_percent": score_percent,
        "results": results,
    }
