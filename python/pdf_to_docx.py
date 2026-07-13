from pdf2docx import Converter
import sys

pdf_path = sys.argv[1]
docx_path = sys.argv[2]

cv = Converter(pdf_path)

cv.convert(docx_path)

cv.close()

print("SUCCESS")