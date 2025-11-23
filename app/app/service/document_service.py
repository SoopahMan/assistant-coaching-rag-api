from typing import Dict, List

from haystack import Document

from .rag_service import document_store, embedder


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def save_to_document(doc_id: int, pages: List[Dict], tables: List[Dict]):
    docs: List[Document] = []

    # --- simpan teks ---
    for pg, text, src in pages:
        for idx, chunk in enumerate(chunk_text(text)):
            docs.append(
                Document(
                    content=chunk,
                    meta={
                        "document_id": doc_id,
                        "page_number": pg,
                        "source": src,
                        "type": "text",
                    },
                )
            )

    # --- simpan tabel ---
    for pg, tidx, table_json in tables:
        header = [str(h) for h in table_json[0].keys()]  # fix: convert to str
        rows = [
            [str(v) for v in row.values()] for row in table_json
        ]  # fix: convert to str

        table_str = "| " + " | ".join(header) + " |\n"
        table_str += "| " + " | ".join(["---"] * len(header)) + " |\n"
        for row in rows:
            table_str += "| " + " | ".join(row) + " |\n"

        docs.append(
            Document(
                content=table_str,
                meta={
                    "document_id": doc_id,
                    "page_number": pg,
                    "table_number": tidx,
                    "type": "table",
                },
            )
        )

    if docs:
        embedded_result = embedder.run(documents=docs)
        embedded_docs = embedded_result["documents"]
        document_store.write_documents(embedded_docs)
        print(f"[INFO] {len(docs)} chunks saved to Chroma (Haystack)")
