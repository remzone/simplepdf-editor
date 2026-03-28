<!-- README.en.md -->
# Light PDF Text Editor (MVP)

A web app for editing **text blocks only** in digital PDFs without OCR.
Primary use case: fixing payment details in invoices, receipts, forms, and similar text PDFs.

## App Screenshot

![Light PDF UI](./docs/app-screenshot.png)

> Screenshot path: `docs/app-screenshot.png`

## MVP Features

- Upload PDF from the web UI.
- View PDF pages in browser.
- Extract text blocks with coordinates.
- Select a block by click.
- Change text, font family, font size, and bold style.
- Partial bold using `**text**` markup.
- Edit text directly inside the block area in preview.
- Drag and resize block (corner handles + scale buttons).
- Add new text block (`Add text`).
- Delete existing block (`Delete block`).
- Apply changes without duplicate old text (redaction + insert).
- Font fallback when source font is unavailable.
- Overflow handling with auto font-size reduction and optional area expansion.
- Download final PDF.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui-style components, react-pdf.
- Backend: Python, FastAPI, PyMuPDF.

## Local Setup

### 1. Backend

```bash
cd /root/project/light-pdf/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Backend: `http://127.0.0.1:8000`

### 2. Frontend

```bash
cd /root/project/light-pdf/frontend
npm install
npm run dev
```

Frontend: `http://127.0.0.1:5173`

## Swagger / API Docs

- Swagger UI: `http://127.0.0.1:8000/swagger`
- ReDoc: `http://127.0.0.1:8000/redoc`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

## Environment Variables

`backend/.env`:

```env
APP_NAME=Light PDF API
API_PREFIX=/api
CORS_ORIGINS=http://localhost:5173
```

## API Endpoints

- `POST /api/pdf/upload` - upload PDF.
- `GET /api/pdf/{document_id}/blocks` - extracted text blocks.
- `POST /api/pdf/{document_id}/apply` - apply text change/addition.
- `POST /api/pdf/{document_id}/delete` - delete text in selected area.
- `GET /api/pdf/{document_id}/preview` - current editable PDF preview.
- `GET /api/pdf/{document_id}/download` - download final PDF.

## MVP Limitations

- Digital PDFs only (extractable text required).
- No OCR / no scanned-document support.
- No image or advanced vector object editing.
- Not a full Acrobat-like editor.

## Roadmap

1. Change history + undo/redo.
2. Eraser mode (delete by click in page).
3. Batch edits for multiple blocks.
4. Better collision preview for auto-expanded blocks.
5. Safe custom font import and validation.
