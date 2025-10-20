import os
from typing import Dict, List

from dotenv import load_dotenv
from haystack import Document, Pipeline
from haystack.components.builders.prompt_builder import PromptBuilder
from haystack.components.embedders import OpenAIDocumentEmbedder
from haystack.components.generators import OpenAIGenerator
from haystack.components.preprocessors import DocumentCleaner
from haystack.utils import Secret
from haystack_integrations.components.retrievers.chroma import ChromaEmbeddingRetriever
from haystack_integrations.document_stores.chroma import ChromaDocumentStore

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY", "")

document_store = ChromaDocumentStore(
    host="localhost",
    port=8002,
    collection_name="rag_documents",
)
embedder = OpenAIDocumentEmbedder()

prompt_template = """
Given these documents, answer the question.
Documents:
{% for doc in documents %}
    {{ doc.content }}
{% endfor %}
Question: {{question}}
Answer:
"""

retriever = ChromaEmbeddingRetriever(document_store=document_store)
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


def convert_to_documents(ocr_data: List[Dict]) -> List[Document]:
    return [
        Document(
            content=item["content"],
            meta={"filename": item["filename"], "page_number": item["page_number"]},
        )
        for item in ocr_data
        if item["content"].strip()
    ]


def save_documents(ocr_data: List[Dict]):
    docs = convert_to_documents(ocr_data)

    cleaner = DocumentCleaner()
    cleaned_result = cleaner.run(documents=docs)
    docs = cleaned_result["documents"]

    embedded_result = embedder.run(documents=docs)
    embedded_docs = embedded_result["documents"]

    document_store.write_documents(embedded_docs)
