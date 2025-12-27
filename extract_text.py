import fitz
import os

pdf_path = r"C:\Users\KerimPC\Documents\webstudy\study-materials\ALMANCA A1.2 ATA Yayıncılık DERS 2024.pdf"
doc = fitz.open(pdf_path)

print("=== THEME 6: TRADITIONEN - Full Text Extraction ===\n")

for page_num in range(59, 70):  # Pages 60-70
    page = doc[page_num]
    text = page.get_text()
    print(f"\n--- PAGE {page_num + 1} ---")
    print(text)

doc.close()
