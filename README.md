<!-- README.md -->
# Light PDF Text Editor (MVP)

[EN](#english) | [RU](#русский)

## English

### Screenshot

![Light PDF UI](./docs/app-screenshot.png)

### Overview

Light PDF Text Editor is a web app for editing **text blocks only** in digital PDFs without OCR.
Primary use case: fixing details in invoices, payment forms, and receipts.

### Features

- Upload PDF from web UI.
- View pages in browser.
- Extract text blocks with coordinates.
- Select block and edit text.
- Change font family, font size, bold.
- Partial bold with `**text**` markup.
- Type directly inside block area in preview.
- Drag / resize block and scale by buttons.
- Add new text block.
- Delete existing block.
- Apply changes without duplicate old text (redaction + insert).
- Font fallback when source font is unavailable.
- Overflow handling and warnings.
- Download final PDF.
- UI language switch: `EN / RU`.

### Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui-style components, react-pdf.
- Backend: Python, FastAPI, PyMuPDF.

### Local Run

Backend:

```bash
cd /root/project/light-pdf/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd /root/project/light-pdf/frontend
npm install
npm run build
npm run dev
```

### API Docs

- Swagger UI: `http://127.0.0.1:8000/swagger`
- ReDoc: `http://127.0.0.1:8000/redoc`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

### API Endpoints

- `POST /api/pdf/upload`
- `GET /api/pdf/{document_id}/blocks`
- `POST /api/pdf/{document_id}/apply`
- `POST /api/pdf/{document_id}/delete`
- `GET /api/pdf/{document_id}/preview`
- `GET /api/pdf/{document_id}/download`

---

## Русский

### Скриншот

![Light PDF UI](./docs/app-screenshot.png)

### Описание

Light PDF Text Editor — веб-приложение для редактирования **только текстовых блоков** в цифровых PDF без OCR.
Основной сценарий: правки реквизитов в счетах, платежных формах и квитанциях.

### Возможности

- Загрузка PDF через веб-интерфейс.
- Просмотр страниц в браузере.
- Извлечение текстовых блоков с координатами.
- Выбор блока и редактирование текста.
- Изменение шрифта, размера и жирности.
- Частичная жирность через `**текст**`.
- Печать прямо в области блока в превью.
- Перемещение / resize блока и масштаб кнопками.
- Добавление нового текстового блока.
- Удаление существующего блока.
- Применение без дублей старого текста (redaction + вставка).
- Fallback шрифтов при недоступности исходного.
- Контроль переполнения и предупреждения.
- Скачивание итогового PDF.
- Переключение языка интерфейса: `EN / RU`.

### Стек

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui-style компоненты, react-pdf.
- Backend: Python, FastAPI, PyMuPDF.

### Локальный запуск

Backend:

```bash
cd /root/project/light-pdf/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd /root/project/light-pdf/frontend
npm install
npm run build
npm run dev
```

### API документация

- Swagger UI: `http://127.0.0.1:8000/swagger`
- ReDoc: `http://127.0.0.1:8000/redoc`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

### API endpoints

- `POST /api/pdf/upload`
- `GET /api/pdf/{document_id}/blocks`
- `POST /api/pdf/{document_id}/apply`
- `POST /api/pdf/{document_id}/delete`
- `GET /api/pdf/{document_id}/preview`
- `GET /api/pdf/{document_id}/download`
