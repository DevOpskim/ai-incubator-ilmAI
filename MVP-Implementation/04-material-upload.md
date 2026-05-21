# Step 4: Implement Material Upload and Knowledge Base

## Objective
Allow users to upload study materials and convert them into a searchable personal knowledge base.

## Why this matters
This is the core differentiator: the AI must work with users' own documents, not prebuilt content.

## Deliverables
- Upload support for PDF, Word, text, and paste input
- File storage and metadata tracking
- Text extraction, chunking, and embedding
- Vector database storage of document segments
- Topic / collection assignment UI
- Support for updating, replacing, and removing materials

## Tasks
1. Build upload UI with drag/drop and paste support.
2. Store raw files in file storage (S3/Supabase or local dev storage).
3. Extract text from uploaded files.
4. Chunk text into meaningful segments.
5. Generate embeddings for chunks and save them in the vector store.
6. Persist metadata:
   - original file name
   - upload date
   - user ID
   - topic / collection
7. Support editing and deleting uploaded materials without breaking the user’s library.

## Onboarding notes
- Start with local file storage, then swap in cloud storage later.
- Keep chunk size and overlap configurable.
- Track the source location for every chunk so answers can be cited.
