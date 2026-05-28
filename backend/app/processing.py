from pathlib import Path
from typing import List
from uuid import uuid4

from app.db.session import SessionLocal
from app.models.tables import MaterialChunk, Upload
from app.services.llm import generate_embedding


def extract_text_from_file(file_path: Path, file_extension: str) -> str:
    try:
        if file_extension == ".pdf":
            import pypdf
            text = ""
            with pypdf.PdfReader(file_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text()
            return text
        elif file_extension in [".doc", ".docx"]:
            import docx2txt
            return docx2txt.process(str(file_path))
        else:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
    except Exception as e:
        raise Exception(f"Failed to extract text from {file_path}: {str(e)}")


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def process_material_upload(upload_id: str):
    db = SessionLocal()
    try:
        upload = db.query(Upload).filter(Upload.id == upload_id).first()
        if not upload:
            raise Exception(f"Upload {upload_id} not found")

        if upload.status != "pending":
            raise Exception(f"Upload {upload_id} is not in pending state")

        upload.status = "processing"
        db.commit()

        file_path = Path(upload.storage_path)
        file_ext = Path(upload.original_filename).suffix.lower()
        text = extract_text_from_file(file_path, file_ext)

        chunks = chunk_text(text)

        material_id = upload.material_id
        for idx, chunk in enumerate(chunks):
            try:
                embedding = generate_embedding(chunk)
            except Exception:
                embedding = None

            material_chunk = MaterialChunk(
                id=uuid4(),
                material_id=material_id,
                chunk_index=idx,
                content=chunk,
                source_ref=f"Page {idx+1}",
                embedding=embedding,
            )
            db.add(material_chunk)

        db.commit()

        upload.status = "ready"
        db.commit()

        print(f"Successfully processed upload {upload_id}. Created {len(chunks)} chunks.")

    except Exception as e:
        upload.status = "failed"
        db.commit()
        print(f"Failed to process upload {upload_id}: {str(e)}")
    finally:
        db.close()


def resume_pending_processing():
    db = SessionLocal()
    try:
        stuck = db.query(Upload).filter(Upload.status.in_(["processing", "pending"])).all()
        if not stuck:
            return
        print(f"Resuming {len(stuck)} stuck uploads...")
        for upload in stuck:
            upload.status = "pending"
        db.commit()
        for upload in stuck:
            try:
                process_material_upload(str(upload.id))
            except Exception as e:
                print(f"Failed to reprocess upload {upload.id}: {e}")
    finally:
        db.close()


def retry_null_embeddings():
    print("RETRY_EMBEDDINGS: Starting...")
    db = SessionLocal()
    try:
        chunks = db.query(MaterialChunk).filter(MaterialChunk.embedding.is_(None)).all()
        print(f"RETRY_EMBEDDINGS: Found {len(chunks)} chunks with null embeddings")
        if not chunks:
            return
        print(f"Retrying embeddings for {len(chunks)} chunks...")
        for chunk in chunks:
            try:
                embedding = generate_embedding(chunk.content)
                chunk.embedding = embedding
                db.commit()
            except Exception as e:
                print(f"Embedding retry failed for chunk {chunk.id}: {e}")
        print("Finished retrying embeddings.")
    finally:
        db.close()
