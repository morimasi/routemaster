# -*- coding: utf-8 -*-
"""
ShuttleX PDF Extraction Script (Robust & Cross-Platform)
"""
import os
import sys

def extract_pdf_content(file_path):
    text_content = []
    
    # Try pypdf first, fallback to PyPDF2
    try:
        import pypdf
        reader = pypdf.PdfReader(file_path)
    except ImportError:
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(file_path)
        except ImportError:
            return "Hata: 'pypdf' veya 'PyPDF2' kütüphanesi kurulu değil."

    for idx, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        text_content.append(f"--- Sayfa {idx + 1}/{len(reader.pages)} ---\n{page_text}")

    return "\n\n".join(text_content)

def main():
    pdf_files = ["kur1.pdf", "kur2.pdf"]
    for pdf_file in pdf_files:
        if not os.path.exists(pdf_file):
            print(f"Uyarı: {pdf_file} bulunamadı.")
            continue
            
        print(f"İşleniyor: {pdf_file}...")
        content = extract_pdf_content(pdf_file)
        
        txt_filename = os.path.splitext(pdf_file)[0] + "_clean.txt"
        with open(txt_filename, "w", encoding="utf-8") as f:
            f.write(content)
            
        print(f"Başarıyla kaydedildi -> {txt_filename} ({len(content)} karakter)")

if __name__ == "__main__":
    main()
