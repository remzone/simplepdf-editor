// frontend/src/pages/HomePage.tsx
import { useState } from "react";

import { BlockEditor } from "@/components/pdf/BlockEditor";
import { PdfUploader } from "@/components/pdf/PdfUploader";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { Card } from "@/components/ui/card";
import { applyChange, deleteBlock, fetchBlocks, getDownloadUrl, getPreviewUrl, uploadPdf } from "@/lib/api";
import type { BlockRect, BlocksResponse, EditorDraft, TextBlock } from "@/types/pdf";

function scaleRect(rect: BlockRect, factor: number, pageWidth: number, pageHeight: number): BlockRect {
  const cx = (rect.x0 + rect.x1) / 2;
  const cy = (rect.y0 + rect.y1) / 2;
  const halfW = ((rect.x1 - rect.x0) * factor) / 2;
  const halfH = ((rect.y1 - rect.y0) * factor) / 2;
  return {
    x0: Math.max(0, cx - halfW),
    y0: Math.max(0, cy - halfH),
    x1: Math.min(pageWidth, cx + halfW),
    y1: Math.min(pageHeight, cy + halfH),
  };
}

function createNewBlock(page: number, rect: BlockRect): TextBlock {
  return {
    id: `new:${Date.now()}`,
    page,
    rect,
    text: "",
    font: "Helvetica",
    size: 11,
  };
}

export function HomePage() {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [blocksData, setBlocksData] = useState<BlocksResponse | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<TextBlock | null>(null);
  const [draftRect, setDraftRect] = useState<BlockRect | null>(null);
  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [draftTextFromCanvas, setDraftTextFromCanvas] = useState<string | null>(null);
  const [addTextMode, setAddTextMode] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refreshBlocks(docId: string) {
    const data = await fetchBlocks(docId);
    setBlocksData(data);
  }

  async function handleUpload(file: File) {
    try {
      setError(null);
      setWarnings([]);
      setSelectedBlock(null);
      setDraft(null);
      setDraftRect(null);
      setAddTextMode(false);
      setUploading(true);

      const result = await uploadPdf(file);
      setDocumentId(result.document_id);
      await refreshBlocks(result.document_id);
      setPreviewVersion((prev) => prev + 1);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleApply(payload: { text: string; font: string; fontSize: number; bold: boolean }) {
    if (!documentId || !selectedBlock) {
      return;
    }

    try {
      setError(null);
      setSaving(true);

      const response = await applyChange(documentId, {
        page: selectedBlock.page,
        block_id: selectedBlock.id,
        rect: draft?.rect ?? draftRect ?? selectedBlock.rect,
        text: payload.text,
        font: payload.font,
        font_size: payload.fontSize,
        bold: payload.bold,
        clear_old: !selectedBlock.id.startsWith("new:"),
      });

      setWarnings(response.warnings);
      await refreshBlocks(documentId);
      setPreviewVersion((prev) => prev + 1);
      setSelectedBlock(null);
      setDraftRect(null);
      setDraft(null);
      setDraftTextFromCanvas(null);
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Unable to apply changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!documentId || !selectedBlock) {
      return;
    }

    if (selectedBlock.id.startsWith("new:")) {
      setSelectedBlock(null);
      setDraftRect(null);
      setDraft(null);
      setDraftTextFromCanvas(null);
      return;
    }

    try {
      setSaving(true);
      await deleteBlock(documentId, {
        page: selectedBlock.page,
        rect: draft?.rect ?? draftRect ?? selectedBlock.rect,
      });
      await refreshBlocks(documentId);
      setPreviewVersion((prev) => prev + 1);
      setSelectedBlock(null);
      setDraftRect(null);
      setDraft(null);
      setDraftTextFromCanvas(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete block");
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    if (!documentId) {
      return;
    }
    window.open(getDownloadUrl(documentId), "_blank", "noopener,noreferrer");
  }

  function handleSelectBlock(block: TextBlock) {
    setAddTextMode(false);
    setSelectedBlock(block);
    setDraftRect(block.rect);
    setDraftTextFromCanvas(null);
  }

  function handleRectChange(nextRect: BlockRect) {
    setDraftRect(nextRect);
    setDraft((prev) => {
      if (!prev || !selectedBlock) {
        return prev;
      }
      return { ...prev, rect: nextRect };
    });
  }

  function handleScaleRect(factor: number) {
    if (!selectedBlock || !blocksData) {
      return;
    }
    if (factor === 1) {
      handleRectChange(selectedBlock.rect);
      return;
    }
    const pageLayout = blocksData.pages.find((p) => p.page === selectedBlock.page);
    if (!pageLayout) {
      return;
    }
    const current = draftRect ?? selectedBlock.rect;
    handleRectChange(scaleRect(current, factor, pageLayout.width, pageLayout.height));
  }

  function handleCreateTextBlock(page: number, rect: BlockRect) {
    const block = createNewBlock(page, rect);
    setAddTextMode(false);
    setSelectedBlock(block);
    setDraftRect(rect);
    setDraftTextFromCanvas("");
    setDraft({
      blockId: block.id,
      page,
      rect,
      text: "",
      font: "Helvetica",
      fontSize: 11,
      bold: false,
    });
  }

  function handleDraftTextChange(text: string) {
    setDraftTextFromCanvas(text);
    setDraft((prev) => (prev ? { ...prev, text } : prev));
  }

  const previewUrl = documentId ? `${getPreviewUrl(documentId)}?v=${previewVersion}` : "";

  return (
    <main className="relative min-h-screen overflow-hidden p-4 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,132,255,0.25),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(23,162,184,0.2),transparent_35%)]" />

      <div className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-4">
        <header className="flex items-center justify-between rounded-2xl border border-white/35 bg-panel px-5 py-4 shadow-glass backdrop-blur-glass">
          <div>
            <h1 className="text-2xl font-bold text-text">Light PDF Text Editor</h1>
            <p className="text-sm text-slate-600">Fast text replacement for digital PDFs: invoices, forms, and receipts.</p>
          </div>
        </header>

        <PdfUploader loading={uploading} onUpload={handleUpload} />

        {error && <Card className="border-rose-200 bg-rose-100/70 p-3 text-sm text-rose-800">{error}</Card>}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_370px]">
          {documentId && blocksData ? (
            <PdfViewer
              fileUrl={previewUrl}
              pages={blocksData.pages}
              blocks={blocksData.blocks}
              selectedBlockId={selectedBlock?.id ?? null}
              draft={draft}
              addTextMode={addTextMode}
              onSelectBlock={handleSelectBlock}
              onRectChange={handleRectChange}
              onCreateTextBlock={handleCreateTextBlock}
              onDraftTextChange={handleDraftTextChange}
            />
          ) : (
            <Card className="flex h-[calc(100vh-220px)] items-center justify-center p-5 text-slate-600">
              Upload PDF to start editing text blocks.
            </Card>
          )}

          <BlockEditor
            block={selectedBlock}
            draftRect={draftRect}
            draftTextFromCanvas={draftTextFromCanvas}
            saving={saving}
            warnings={warnings}
            addTextMode={addTextMode}
            onApply={handleApply}
            onDelete={handleDelete}
            onDraftChange={setDraft}
            onScaleRect={handleScaleRect}
            onToggleAddTextMode={() => setAddTextMode((prev) => !prev)}
            onDownload={handleDownload}
          />
        </div>
      </div>
    </main>
  );
}
