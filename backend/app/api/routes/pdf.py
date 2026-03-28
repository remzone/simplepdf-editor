# backend/app/api/routes/pdf.py
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import FileResponse

from app.schemas.pdf import (
    ApplyChangeRequest,
    ApplyChangeResponse,
    BlocksResponse,
    DeleteBlockRequest,
    DeleteBlockResponse,
    UploadResponse,
)
from app.services.document_service import DocumentService
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/pdf", tags=["pdf"])


@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload PDF",
    description="Upload a digital PDF and create an editable document session.",
)
async def upload_pdf(file: UploadFile = File(...)) -> UploadResponse:
    document_id, filename = DocumentService.create_document(file)
    return UploadResponse(document_id=document_id, filename=filename)


@router.get(
    "/{document_id}/blocks",
    response_model=BlocksResponse,
    summary="Get text blocks",
    description="Return extracted text blocks with page coordinates.",
)
def get_blocks(document_id: str) -> BlocksResponse:
    output_path = DocumentService.get_output_path(document_id)
    return PDFService.extract_blocks(document_id=document_id, file_path=str(output_path))


@router.post(
    "/{document_id}/apply",
    response_model=ApplyChangeResponse,
    summary="Apply text change",
    description="Replace/add text in a target block with optional font and size settings.",
)
def apply_change(document_id: str, payload: ApplyChangeRequest) -> ApplyChangeResponse:
    output_path = DocumentService.get_output_path(document_id)
    warnings = PDFService.apply_change(str(output_path), payload)
    applied = not any("not applied" in warning.lower() for warning in warnings)
    return ApplyChangeResponse(document_id=document_id, applied=applied, warnings=warnings)


@router.post(
    "/{document_id}/delete",
    response_model=DeleteBlockResponse,
    summary="Delete text block",
    description="Remove text content inside selected block rectangle using PDF redaction.",
)
def delete_block(document_id: str, payload: DeleteBlockRequest) -> DeleteBlockResponse:
    output_path = DocumentService.get_output_path(document_id)
    deleted = PDFService.delete_block(
        str(output_path),
        payload.page,
        (payload.rect.x0, payload.rect.y0, payload.rect.x1, payload.rect.y1),
    )
    return DeleteBlockResponse(document_id=document_id, deleted=deleted)


@router.get(
    "/{document_id}/preview",
    summary="Preview edited PDF",
    description="Get current editable PDF file for in-app preview.",
)
def preview_pdf(document_id: str) -> FileResponse:
    output_path = DocumentService.get_output_path(document_id)
    return FileResponse(path=output_path, media_type="application/pdf", filename=f"{document_id}.pdf")


@router.get(
    "/{document_id}/download",
    summary="Download edited PDF",
    description="Download final edited PDF.",
)
def download_pdf(document_id: str) -> FileResponse:
    output_path = DocumentService.get_output_path(document_id)
    return FileResponse(
        path=output_path,
        media_type="application/pdf",
        filename=f"edited-{document_id}.pdf",
    )
