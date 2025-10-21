import os
import re
from typing import Dict, List

import tiktoken
from dotenv import load_dotenv  
from haystack import Document, Pipeline
from haystack.components.builders.prompt_builder import PromptBuilder
from haystack.components.embedders import OpenAIDocumentEmbedder
from haystack.components.generators import OpenAIGenerator
from haystack.utils import Secret
from haystack_integrations.components.retrievers.chroma import ChromaEmbeddingRetriever
from haystack_integrations.document_stores.chroma import ChromaDocumentStore

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY", "")

document_store = ChromaDocumentStore(
    host="localhost",
    port=8002,
    collection_name="rag_gp_documents",
)

embedder = OpenAIDocumentEmbedder(api_key=Secret.from_token(openai_api_key))

retriever = ChromaEmbeddingRetriever(document_store=document_store)

prompt_template ="""
## SYSTEM PROMPT: ASISTEN BIMBINGAN CALON GURU (DYNAMIC CONTEXT-AWARE)

PERAN:
Anda adalah *asisten bimbingan Calon Guru (CG)* yang membantu menjelaskan konsep, prinsip, atau alur pembelajaran secara **komprehensif, faktual, dan adaptif terhadap konteks pertanyaan**, berdasarkan isi dokumen resmi yang telah diunggah.  
Anda **tidak menambahkan informasi di luar dokumen ({{ documents }})**, dan hanya menginterpretasikan isi dokumen dengan bahasa yang jelas dan profesional.

PEDOMAN JAWABAN:
1. Gunakan **hanya** informasi dari dokumen yang ada di konteks (`{{ documents }}`).
2. Bentuk jawaban harus **menyesuaikan jenis pertanyaan**:
   - Jika pertanyaan memuat kata seperti *“prinsip”, “komponen”, “aspek”, “jenis”*, tulis dalam bentuk **poin atau penomoran** yang menjelaskan tiap butir secara utuh.
   - Jika pertanyaan memuat kata seperti *“alur”, “tahapan”, “langkah”, “proses”*, gunakan bentuk **alur naratif berurutan** (misal: *Pertama..., kemudian..., selanjutnya..., terakhir...*).
   - Jika pertanyaan memuat kata seperti *“jelaskan”, “apa yang dimaksud”, “mengapa penting”*, berikan **narasi deskriptif komprehensif** (tanpa poin, menjelaskan konsep secara menyeluruh).
3. Jika dokumen tidak menyediakan informasi yang cukup, nyatakan dengan sopan:  
   “Informasi terkait belum tersedia dalam dokumen yang ada.”
4. Gunakan gaya bahasa **ilmiah-populer dan komunikatif**, seperti dosen pembimbing atau guru pamong.
5. Tutup jawaban dengan keterangan sumber, misalnya:  
   `Sumber: Panduan Pembelajaran Mendalam.pdf (hal. 12–14)`

KONTEKS DOKUMEN:
{% for doc in documents %}
[Sumber: {{ doc.meta.filename }}]
{{ doc.content }}

{% endfor %}

PERMINTAAN PENGGUNA:
Pertanyaan: {{ question }}

TUGAS:
- Analisis jenis pertanyaan untuk menentukan bentuk jawaban yang paling sesuai (naratif, poin, atau alur).
- Jelaskan isi jawaban secara komprehensif berdasarkan dokumen.
- Pastikan tidak ada halusinasi atau tambahan dari luar dokumen.

FORMAT OUTPUT:
---
[Tulis penjelasan sesuai konteks pertanyaan dan isi dokumen.]

Sumber:
- [Nama Dokumen atau File] (hal. ... jika tersedia)

"""

prompt_builder = PromptBuilder(
    template=prompt_template, required_variables=["question", "documents"]
)

llm = OpenAIGenerator(api_key=Secret.from_token(openai_api_key))

rag_pipeline = Pipeline()
rag_pipeline.add_component("retriever", retriever)
rag_pipeline.add_component("prompt_builder", prompt_builder)
rag_pipeline.add_component("llm", llm)

rag_pipeline.connect("retriever.documents", "prompt_builder.documents")
rag_pipeline.connect("prompt_builder.prompt", "llm.prompt")


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    return text


def chunk_text_by_tokens(
    text: str, max_tokens: int = 300, overlap_tokens: int = 50
) -> List[str]:
    """Split text into chunks using token count (OpenAI tokenizer)."""
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)
    chunks = []

    start = 0
    while start < len(tokens):
        end = min(start + max_tokens, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text = enc.decode(chunk_tokens)
        chunks.append(chunk_text)
        start += max_tokens - overlap_tokens

    return chunks


def convert_to_documents(
    ocr_data: List[Dict], max_tokens=300, overlap_tokens=50
) -> List[Document]:
    """Convert OCR output into cleaned & chunked Haystack Documents."""
    docs = []
    for item in ocr_data:
        cleaned_content = clean_text(item["content"])
        if not cleaned_content:
            continue

        chunks = chunk_text_by_tokens(cleaned_content, max_tokens, overlap_tokens)
        for idx, chunk in enumerate(chunks):
            docs.append(
                Document(
                    content=chunk,
                    meta={
                        "filename": item["filename"],
                        "page_number": item["page_number"],
                        "chunk_id": idx,
                    },
                )
            )
    return docs


def save_documents(ocr_data: List[Dict]):
    """Clean, chunk, embed, and save OCR documents to Chroma."""
    docs = convert_to_documents(ocr_data)
    embedded_result = embedder.run(documents=docs)
    embedded_docs = embedded_result["documents"]
    document_store.write_documents(embedded_docs)
