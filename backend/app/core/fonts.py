# backend/app/core/fonts.py
from dataclasses import dataclass


@dataclass
class FontResolution:
    requested_font: str
    resolved_font: str
    used_fallback: bool
    message: str | None = None


FALLBACK_FONT = "helv"

# PyMuPDF Base14 aliases
KNOWN_FONT_ALIASES: dict[str, str] = {
    "helvetica": "helv",
    "arial": "helv",
    "sans": "helv",
    "sans-serif": "helv",
    "times": "tiro",
    "times-roman": "tiro",
    "serif": "tiro",
    "courier": "cour",
    "monospace": "cour",
    "symbol": "symb",
    "zapfdingbats": "zapfd",
}


def _normalize_font_name(font_name: str | None) -> str:
    if not font_name:
        return ""
    return font_name.strip().lower().replace("_", "-")


def resolve_font(font_name: str | None) -> FontResolution:
    normalized = _normalize_font_name(font_name)

    if normalized in KNOWN_FONT_ALIASES:
        resolved = KNOWN_FONT_ALIASES[normalized]
        return FontResolution(
            requested_font=font_name or "",
            resolved_font=resolved,
            used_fallback=False,
            message=None,
        )

    for key, mapped in KNOWN_FONT_ALIASES.items():
        if key in normalized:
            return FontResolution(
                requested_font=font_name or "",
                resolved_font=mapped,
                used_fallback=False,
                message=None,
            )

    display_name = font_name or "Unknown"
    return FontResolution(
        requested_font=display_name,
        resolved_font=FALLBACK_FONT,
        used_fallback=True,
        message=f"Font '{display_name}' is not available. Fallback 'Helvetica' was used.",
    )
