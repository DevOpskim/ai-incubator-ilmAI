from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tables import MaterialChunk
from app.services.llm import generate_embedding


def search_chunks(
    query: str,
    user_id: UUID,
    db: Session,
    limit: int = 5,
) -> list[MaterialChunk]:
    embedding = generate_embedding(query)
    return search_chunks_by_embedding(embedding, user_id, db, limit)


def search_chunks_by_embedding(
    embedding: list[float],
    user_id: UUID,
    db: Session,
    limit: int = 5,
) -> list[MaterialChunk]:
    from sqlalchemy import text

    sql = text("""
        SELECT mc.id, mc.material_id, mc.chunk_index, mc.content,
               mc.source_ref, mc.embedding, mc.created_at,
               mc.embedding <=> :embedding AS distance
        FROM material_chunks mc
        JOIN materials m ON m.id = mc.material_id
        WHERE m.user_id = :user_id
          AND mc.embedding IS NOT NULL
        ORDER BY mc.embedding <=> :embedding
        LIMIT :limit
    """)

    result = db.execute(sql, {
        "embedding": embedding,
        "user_id": user_id,
        "limit": limit,
    })

    chunks = []
    for row in result:
        chunk = MaterialChunk(
            id=row.id,
            material_id=row.material_id,
            chunk_index=row.chunk_index,
            content=row.content,
            source_ref=row.source_ref,
            embedding=row.embedding,
            created_at=row.created_at,
        )
        chunks.append(chunk)

    return chunks
