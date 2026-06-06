import collections

def analyze_layout(pages):

    header_candidates = collections.Counter()
    footer_candidates = collections.Counter()

    for page in pages:

        for block in page["blocks"]:

            text = block["text"].strip()

            if not text:
                continue

            y = block["y"]

            if y < 80:
                header_candidates[text] += 1

            if y > 700:
                footer_candidates[text] += 1

    repeated_headers = {
        text
        for text, count in header_candidates.items()
        if count >= 3
    }

    repeated_footers = {
        text
        for text, count in footer_candidates.items()
        if count >= 3
    }

    for page in pages:

        cleaned_blocks = []

        for block in page["blocks"]:

            text = block["text"].strip()

            if text in repeated_headers:
                block["type"] = "header"

            elif text in repeated_footers:
                block["type"] = "footer"

            # remove unwanted stuff
            if block["type"] in [
                "header",
                "footer",
                "pageNumber",
                "metadata"
            ]:
                continue

            cleaned_blocks.append(block)

        page["blocks"] = cleaned_blocks

    return pages