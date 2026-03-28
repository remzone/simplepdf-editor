# backend/app/services/document_service.py
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.core.config import OUTPUT_DIR, UPLOAD_DIR


class DocumentService:
    @staticmethod
    def create_document(upload: UploadFile) -> tuple[str, str]:
        if not upload.filename or not upload.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        document_id = str(uuid4())
        safe_name = Path(upload.filename).name
        upload_path = UPLOAD_DIR / f"{document_id}.pdf"
        output_path = OUTPUT_DIR / f"{document_id}.pdf"

        with upload_path.open("wb") as buffer:
            shutil.copyfileobj(upload.file, buffer)

        shutil.copy2(upload_path, output_path)
        return document_id, safe_name

    @staticmethod
    def get_upload_path(document_id: str) -> Path:
        path = UPLOAD_DIR / f"{document_id}.pdf"
        if not path.exists():
            raise HTTPException(status_code=404, detail="Document not found.")
        return path

    @staticmethod
    def get_output_path(document_id: str) -> Path:
        path = OUTPUT_DIR / f"{document_id}.pdf"
        if not path.exists():
            raise HTTPException(status_code=404, detail="Edited document not found.")
        return path
