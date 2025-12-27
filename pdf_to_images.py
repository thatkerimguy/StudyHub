import fitz  # PyMuPDF
import os

# PDF path
pdf_path = r"C:\Users\KerimPC\Documents\webstudy\study-materials\ALMANCA A1.2 ATA Yayıncılık DERS 2024.pdf"
output_dir = r"C:\Users\KerimPC\Documents\webstudy\study-materials\almanca-unit6"

# Create output directory
os.makedirs(output_dir, exist_ok=True)

# Open PDF  
doc = fitz.open(pdf_path)

# Get full TOC
toc = doc.get_toc()
print("Full Table of Contents:")
for item in toc:
    print(f"  {item}")

# Based on pattern: 1->1, 2->20, 3->30, 4->40, likely 5->50, 6->60
# Let's extract pages 60-75 for Theme 6
print("\n\nExtracting pages 60-80 (likely Theme 6)...")

for page_num in range(59, min(80, doc.page_count)):  # 0-indexed, so 59 = page 60
    page = doc[page_num]
    text = page.get_text()
    
    # Save the image
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    img_path = os.path.join(output_dir, f"page_{page_num + 1:03d}.png")
    pix.save(img_path)
    print(f"Saved page {page_num + 1}")
    
    # Print first page text to understand theme
    if page_num == 59:
        print(f"\nPage 60 content preview:\n{text[:800]}")

doc.close()
