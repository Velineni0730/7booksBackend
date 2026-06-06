import fitz
import json
import sys
from layout import analyze_layout

pdf_path = sys.argv[1]

doc = fitz.open(pdf_path)

pages = []

METADATA_KEYWORDS = [
    "copyright",
    "isbn",
    "library of congress",
    "printed in",
    "all rights reserved",
    "distributed by",
    "tuttle publishing"
]

for page_number in range(len(doc)):

    page = doc[page_number]

    blocks = page.get_text("dict")["blocks"]

    page_blocks = []

    for block in blocks:

        # ----------------------
        # IMAGE BLOCKS
        # ----------------------

        if block["type"] == 1:

            page_blocks.append({
                "type": "image",
                "text": "",
                "fontSize": 0,
                "wordCount": 0,
                "x": block["bbox"][0],
                "y": block["bbox"][1],
                "width": block["bbox"][2] - block["bbox"][0]
            })

            continue

        if "lines" not in block:
            continue

        text = ""

        font_size = 0

        for line in block["lines"]:

            for span in line["spans"]:

                text += span["text"] + " "

                if span["size"] > font_size:
                    font_size = span["size"]

        text = text.strip()

        if not text:
            continue

        lower_text = text.lower()

        word_count = len(text.split())

        y_position = block["bbox"][1]

        x_position = block["bbox"][0]

        block_width = block["bbox"][2] - block["bbox"][0]

        # ----------------------
        # CLASSIFICATION
        # ----------------------

        block_type = "paragraph"

        # Cover page
        if page_number == 0:
            block_type = "cover"

        # Metadata
        elif any(keyword in lower_text for keyword in METADATA_KEYWORDS):
            block_type = "metadata"

        # TOC
        elif "contents" in lower_text:
            block_type = "toc"

        # Chapter
        elif lower_text.startswith("chapter"):
            block_type = "chapter"

        # Page Number
        elif text.isdigit() and len(text) <= 4:
            block_type = "pageNumber"

        # Header
        elif y_position < 60:
            block_type = "header"

        # Footer
        elif y_position > page.rect.height - 60:
            block_type = "footer"

        # Heading
        elif font_size >= 20:
            block_type = "heading"

        # Subheading
        elif font_size >= 14:
            block_type = "subheading"

        page_blocks.append({
            "type": block_type,
            "text": text,
            "fontSize": font_size,
            "wordCount": word_count,
            "x": x_position,
            "y": y_position,
            "width": block_width
        })

    pages.append({
        "pageNumber": page_number + 1,
        "blocks": page_blocks
    })

pages = analyze_layout(pages)

print(json.dumps({
    "totalPages": len(doc),
    "pages": pages
}))