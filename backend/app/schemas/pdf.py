# backend/app/schemas/pdf.py
from pydantic import BaseModel, Field


class BlockRect(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float


class TextBlock(BaseModel):
    id: str
    page: int = Field(ge=0)
    rect: BlockRect
    text: str
    font: str
    size: float


class PageLayout(BaseModel):
    page: int = Field(ge=0)
    width: float
    height: float


class BlocksResponse(BaseModel):
    document_id: str
    page_count: int
    pages: list[PageLayout]
    blocks: list[TextBlock]


class UploadResponse(BaseModel):
    document_id: str
    filename: str


class ApplyChangeRequest(BaseModel):
    page: int = Field(ge=0)
    block_id: str
    rect: BlockRect
    text: str
    font: str | None = None
    font_size: float | None = Field(default=None, ge=4, le=72)
    bold: bool = False
    clear_old: bool = True


class DeleteBlockRequest(BaseModel):
    page: int = Field(ge=0)
    rect: BlockRect


class DeleteBlockResponse(BaseModel):
    document_id: str
    deleted: bool


class ApplyChangeResponse(BaseModel):
    document_id: str
    applied: bool
    warnings: list[str] = Field(default_factory=list)
