# backend/app/services/pdf_service.py
import html
import re
from pathlib import Path

import fitz
from fastapi import HTTPException

from app.core.fonts import resolve_font
from app.schemas.pdf import ApplyChangeRequest, BlocksResponse, PageLayout, TextBlock


class PDFService:
    FONT_CSS_MAP: dict[str, str] = {
        "helv": "Helvetica, Arial, sans-serif",
        "tiro": "'Times New Roman', Times, serif",
        "cour": "'Courier New', Courier, monospace",
        "symb": "Symbol",
        "zapfd": "ZapfDingbats",
    }

    @staticmethod
    def extract_blocks(document_id: str, file_path: str) -> BlocksResponse:
        doc = fitz.open(file_path)
        blocks: list[TextBlock] = []
        pages: list[PageLayout] = []

        try:
            for page_index, page in enumerate(doc):
                pages.append(PageLayout(page=page_index, width=page.rect.width, height=page.rect.height))
                raw = page.get_text("dict")

                for block in raw.get("blocks", []):
                    if block.get("type") != 0:
                        continue

                    block_bbox = block.get("bbox")
                    if not block_bbox:
                        continue

                    spans_text: list[str] = []
                    block_font = "Helvetica"
                    block_size = 10.0

                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            text = (span.get("text") or "").strip()
                            if text:
                                spans_text.append(text)
                                block_font = span.get("font", block_font)
                                block_size = float(span.get("size", block_size))

                    merged = " ".join(spans_text).strip()
                    if not merged:
                        continue

                    x0, y0, x1, y1 = block_bbox
                    block_id = f"{page_index}:{x0:.2f}:{y0:.2f}:{x1:.2f}:{y1:.2f}"
                    blocks.append(
                        TextBlock(
                            id=block_id,
                            page=page_index,
                            rect={"x0": x0, "y0": y0, "x1": x1, "y1": y1},
                            text=merged,
                            font=block_font,
                            size=round(block_size, 2),
                        )
                    )
        finally:
            doc.close()

        return BlocksResponse(document_id=document_id, page_count=len(pages), pages=pages, blocks=blocks)

    @staticmethod
    def _text_to_html(text: str, bold_all: bool = False) -> str:
        chunks = re.split(r"(\*\*.*?\*\*)", text, flags=re.DOTALL)
        html_chunks: list[str] = []
        for chunk in chunks:
            if chunk.startswith("**") and chunk.endswith("**") and len(chunk) > 4:
                html_chunks.append(f"<b>{html.escape(chunk[2:-2])}</b>")
            else:
                html_chunks.append(html.escape(chunk))
        merged = "".join(html_chunks).replace("\n", "<br/>")
        if bold_all:
            merged = f"<b>{merged}</b>"
        return f"<div>{merged}</div>"

    @staticmethod
    def _build_css(font_name: str, font_size: float) -> str:
        family = PDFService.FONT_CSS_MAP.get(font_name, PDFService.FONT_CSS_MAP["helv"])
        return (
            "* {"
            f" font-family: {family};"
            f" font-size: {font_size}px;"
            " line-height: 1.25;"
            " color: #000000;"
            "}"
        )

    @staticmethod
    def _fits_box(block_rect: fitz.Rect, html_text: str, css: str) -> float:
        probe_doc = fitz.open()
        try:
            # Measure in local block coordinates, not original page coordinates.
            local_rect = fitz.Rect(0, 0, block_rect.width, block_rect.height)
            probe_page = probe_doc.new_page(width=block_rect.width, height=block_rect.height)
            spare_height, _ = probe_page.insert_htmlbox(
                local_rect,
                html_text,
                css=css,
                scale_low=1,
            )
            return spare_height
        finally:
            probe_doc.close()

    @staticmethod
    def _find_fit_size(
        rect: fitz.Rect,
        html_text: str,
        font_name: str,
        start_size: float,
        min_size: float,
    ) -> float | None:
        current_size = start_size
        while current_size >= min_size:
            css = PDFService._build_css(font_name, current_size)
            result = PDFService._fits_box(rect, html_text, css)
            if result >= 0:
                return current_size
            current_size = round(current_size - 0.5, 2)
        return None

    @staticmethod
    def _find_expanded_fit(
        page_rect: fitz.Rect,
        original_rect: fitz.Rect,
        html_text: str,
        font_name: str,
        start_size: float,
        min_size: float,
    ) -> tuple[fitz.Rect, float] | None:
        # Conservative expansion factors to reduce overlap risk with nearby content.
        scale_candidates = [
            (1.0, 1.25),
            (1.0, 1.5),
            (1.15, 1.5),
            (1.25, 1.8),
            (1.4, 2.2),
        ]

        for width_scale, height_scale in scale_candidates:
            max_width = page_rect.x1 - original_rect.x0
            max_height = page_rect.y1 - original_rect.y0
            new_width = min(original_rect.width * width_scale, max_width)
            new_height = min(original_rect.height * height_scale, max_height)
            expanded = fitz.Rect(
                original_rect.x0,
                original_rect.y0,
                original_rect.x0 + new_width,
                original_rect.y0 + new_height,
            )
            size = PDFService._find_fit_size(expanded, html_text, font_name, start_size, min_size)
            if size is not None:
                return expanded, size
        return None

    @staticmethod
    def apply_change(file_path: str, payload: ApplyChangeRequest) -> list[str]:
        doc = fitz.open(file_path)
        warnings: list[str] = []

        try:
            if payload.page >= len(doc):
                raise HTTPException(status_code=400, detail="Page index is out of range.")

            page = doc[payload.page]
            rect = fitz.Rect(payload.rect.x0, payload.rect.y0, payload.rect.x1, payload.rect.y1)
            chosen_font = resolve_font(payload.font)

            if chosen_font.message:
                warnings.append(chosen_font.message)

            start_size = payload.font_size if payload.font_size else 11.0
            min_size = 6.0
            html_text = PDFService._text_to_html(payload.text, bold_all=payload.bold)
            final_rect = rect
            fitted_size = PDFService._find_fit_size(rect, html_text, chosen_font.resolved_font, start_size, min_size)

            if fitted_size is None:
                expanded_fit = PDFService._find_expanded_fit(
                    page.rect,
                    rect,
                    html_text,
                    chosen_font.resolved_font,
                    start_size,
                    min_size,
                )
                if expanded_fit is None:
                    warnings.append(
                        "Text does not fit into the selected block even after reducing font size and expanding area. "
                        "Change was not applied."
                    )
                    return warnings
                final_rect, fitted_size = expanded_fit
                warnings.append(
                    "Block area was expanded automatically to fit text. Check surrounding content for overlap."
                )

            css = PDFService._build_css(chosen_font.resolved_font, fitted_size)
            if payload.clear_old:
                page.add_redact_annot(final_rect, fill=(1, 1, 1))
                page.apply_redactions()
            page.insert_htmlbox(
                final_rect,
                html_text,
                css=css,
                scale_low=1,
                overlay=True,
            )

            if fitted_size < start_size:
                warnings.append(
                    f"Font size was reduced from {start_size:.1f} to {fitted_size:.1f} to fit text into the block."
                )

            target = Path(file_path)
            temp_output = target.with_suffix(".tmp.pdf")
            doc.save(str(temp_output), garbage=3, deflate=True)
            temp_output.replace(target)
            return warnings
        finally:
            doc.close()

    @staticmethod
    def delete_block(file_path: str, page_index: int, rect_payload: tuple[float, float, float, float]) -> bool:
        doc = fitz.open(file_path)
        try:
            if page_index >= len(doc):
                raise HTTPException(status_code=400, detail="Page index is out of range.")

            page = doc[page_index]
            rect = fitz.Rect(*rect_payload)
            page.add_redact_annot(rect, fill=(1, 1, 1))
            page.apply_redactions()

            target = Path(file_path)
            temp_output = target.with_suffix(".tmp.pdf")
            doc.save(str(temp_output), garbage=3, deflate=True)
            temp_output.replace(target)
            return True
        finally:
            doc.close()
