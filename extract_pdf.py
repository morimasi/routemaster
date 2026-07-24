import PyPDF2
import sys

for fname in ['kur1.pdf', 'kur2.pdf']:
    print(f'===== {fname} =====')
    try:
        reader = PyPDF2.PdfReader(fname)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            print(f'--- Sayfa {i+1} ---')
            print(text)
    except Exception as e:
        print(f'Hata: {e}')
    print()
