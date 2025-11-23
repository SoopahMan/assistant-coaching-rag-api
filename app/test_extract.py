import os
from pathlib import Path

import camelot
import pdfplumber
from paddleocr import PaddleOCR
from pdf2image import convert_from_path


def is_text_based(pdf_path: str) -> bool:
    """
    Deteksi apakah PDF berbasis teks atau hasil scan.
    Jika ada teks yang terbaca oleh pdfplumber -> dianggap text-based.
    """

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text and text.strip():
                    return True
    except Exception:
        pass

    return False


def extract_text_pdf(pdf_path: str) -> str:
    """Ekstrak teks langsung dari PDF berbasis teks."""
    texts = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                texts.append(f"\n--- Page {i+1} ---\n{text.strip()}")

    return "\n".join(texts)


def extract_text_ocr(pdf_path: str, lang="id") -> str:
    """Ekstrak teks dari PDF hasil scan menggunakan PaddleOCR."""
    ocr = PaddleOCR(lang=lang)
    texts = []
    pages = convert_from_path(pdf_path, dpi=300)

    for i, page in enumerate(pages):
        image_path = f"page_{i+1}.png"
        page.save(image_path, "PNG")
        result = ocr.predict(image_path)
        page_text = "\n".join([line[1][0] for line in result[0]])
        texts.append(f"\n--- OCR Page {i+1} ---\n{page_text}")
        os.remove(image_path)

    return "\n".join(texts)


def extract_pdf_auto(pdf_path: str, lang: str = "en") -> str:
    """Ekstrak teks PDF secara otomatis (text-based atau OCR)."""
    if is_text_based(pdf_path):
        print("[INFO] PDF terdeteksi sebagai text-based.")
        tables = camelot.read_pdf(pdf_file, pages="all", flavor="lattice")

        print(f"[INFO] Jumlah tabel ditemukan: {len(tables)}")

        # Simpan semua tabel ke CSV & Excel
        for i, table in enumerate(tables):
            print(f"\n--- Tabel {i+1} ---")
            print(table.df)  # df = pandas DataFrame

            # Simpan ke file
            csv_file = f"table_{i+1}.csv"
            table.to_csv(csv_file)

            print(f"[SAVED] {csv_file}")
        return extract_text_pdf(pdf_path)
    else:
        print("[INFO] PDF terdeteksi sebagai image-based (scan).")
        return extract_text_ocr(pdf_path, lang=lang)


if __name__ == "__main__":
    pdf_file = "PEDOMAN PETUNJUK PELAKSANAAN DIKLAT TAHUN 2022 (1).pdf"
    output_text = extract_pdf_auto(pdf_file, lang="id")
    out_file = Path(pdf_file).stem + "_output.txt"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(output_text)

    print(f"[DONE] Hasil ekstraksi disimpan ke {out_file}")
