// frontend/src/components/pdf/PdfViewer.tsx
import { useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BlockRect, EditorDraft, PageLayout, TextBlock } from "@/types/pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PdfViewerProps = {
  fileUrl: string;
  pages: PageLayout[];
  blocks: TextBlock[];
  selectedBlockId: string | null;
  draft: EditorDraft | null;
  addTextMode: boolean;
  onSelectBlock: (block: TextBlock) => void;
  onRectChange: (nextRect: BlockRect) => void;
  onCreateTextBlock: (page: number, rect: BlockRect) => void;
  onDraftTextChange: (text: string) => void;
};

type ResizeHandle = "nw" | "ne" | "sw" | "se";

type DragState = {
  mode: "move" | "resize";
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  startRect: BlockRect;
  scale: number;
  pageWidth: number;
  pageHeight: number;
};

function clampRect(rect: BlockRect, pageWidth: number, pageHeight: number): BlockRect {
  const minSize = 8;
  const width = Math.max(minSize, rect.x1 - rect.x0);
  const height = Math.max(minSize, rect.y1 - rect.y0);
  const x0 = Math.min(Math.max(0, rect.x0), Math.max(0, pageWidth - width));
  const y0 = Math.min(Math.max(0, rect.y0), Math.max(0, pageHeight - height));
  return {
    x0,
    y0,
    x1: x0 + width,
    y1: y0 + height,
  };
}

export function PdfViewer({
  fileUrl,
  pages,
  blocks,
  selectedBlockId,
  draft,
  addTextMode,
  onSelectBlock,
  onRectChange,
  onCreateTextBlock,
  onDraftTextChange,
}: PdfViewerProps) {
  const [pageCount, setPageCount] = useState(0);
  const [drag, setDrag] = useState<DragState | null>(null);

  useEffect(() => {
    if (!drag) {
      return;
    }
    const currentDrag = drag;

    function onMouseMove(event: MouseEvent) {
      const dx = (event.clientX - currentDrag.startX) / currentDrag.scale;
      const dy = (event.clientY - currentDrag.startY) / currentDrag.scale;
      const minSize = 8;

      if (currentDrag.mode === "move") {
        onRectChange(
          clampRect(
            {
              x0: currentDrag.startRect.x0 + dx,
              y0: currentDrag.startRect.y0 + dy,
              x1: currentDrag.startRect.x1 + dx,
              y1: currentDrag.startRect.y1 + dy,
            },
            currentDrag.pageWidth,
            currentDrag.pageHeight
          )
        );
        return;
      }

      let next = { ...currentDrag.startRect };
      if (currentDrag.handle === "nw") {
        next.x0 = Math.min(currentDrag.startRect.x1 - minSize, currentDrag.startRect.x0 + dx);
        next.y0 = Math.min(currentDrag.startRect.y1 - minSize, currentDrag.startRect.y0 + dy);
      }
      if (currentDrag.handle === "ne") {
        next.x1 = Math.max(currentDrag.startRect.x0 + minSize, currentDrag.startRect.x1 + dx);
        next.y0 = Math.min(currentDrag.startRect.y1 - minSize, currentDrag.startRect.y0 + dy);
      }
      if (currentDrag.handle === "sw") {
        next.x0 = Math.min(currentDrag.startRect.x1 - minSize, currentDrag.startRect.x0 + dx);
        next.y1 = Math.max(currentDrag.startRect.y0 + minSize, currentDrag.startRect.y1 + dy);
      }
      if (currentDrag.handle === "se") {
        next.x1 = Math.max(currentDrag.startRect.x0 + minSize, currentDrag.startRect.x1 + dx);
        next.y1 = Math.max(currentDrag.startRect.y0 + minSize, currentDrag.startRect.y1 + dy);
      }

      onRectChange(clampRect(next, currentDrag.pageWidth, currentDrag.pageHeight));
    }

    function onMouseUp() {
      setDrag(null);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [drag, onRectChange]);

  const blocksByPage = useMemo(() => {
    const map = new Map<number, TextBlock[]>();
    for (const block of blocks) {
      if (!map.has(block.page)) {
        map.set(block.page, []);
      }
      map.get(block.page)!.push(block);
    }
    return map;
  }, [blocks]);

  return (
    <Card className="h-[calc(100vh-220px)] overflow-auto p-4">
      <Document key={fileUrl} file={fileUrl} onLoadSuccess={(doc) => setPageCount(doc.numPages)} loading="Loading PDF...">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {Array.from({ length: pageCount }, (_, idx) => {
            const pageNumber = idx + 1;
            const pageIndex = idx;
            const pageBlocks = blocksByPage.get(pageIndex) ?? [];
            const pageLayout = pages.find((p) => p.page === pageIndex);
            const pageWidth = pageLayout?.width ?? 595;
            const pageHeight = pageLayout?.height ?? 842;
            const renderWidth = 820;
            const scale = renderWidth / pageWidth;
            const activeBlock = selectedBlockId ? pageBlocks.find((item) => item.id === selectedBlockId) : null;
            const activeRect = draft && activeBlock && draft.blockId === activeBlock.id ? draft.rect : activeBlock?.rect;

            return (
              <div key={`page-${pageNumber}`} className="relative rounded-xl border border-white/30 bg-white/55 p-2">
                <Page pageNumber={pageNumber} width={renderWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                <button
                  type="button"
                  aria-label="page-hit-area"
                  className={cn("absolute left-2 top-2 h-full w-full", addTextMode ? "cursor-copy" : "cursor-default")}
                  onClick={(event) => {
                    if (!addTextMode) {
                      return;
                    }
                    const target = event.currentTarget.getBoundingClientRect();
                    const localX = event.clientX - target.left;
                    const localY = event.clientY - target.top;
                    const x0 = Math.max(0, localX / scale);
                    const y0 = Math.max(0, localY / scale);
                    onCreateTextBlock(pageIndex, {
                      x0,
                      y0,
                      x1: Math.min(pageWidth, x0 + 220),
                      y1: Math.min(pageHeight, y0 + 70),
                    });
                  }}
                />
                <div className="pointer-events-none absolute left-2 top-2 h-full w-full">
                  {pageBlocks.map((block) => {
                    const left = block.rect.x0 * scale;
                    const top = block.rect.y0 * scale;
                    const width = (block.rect.x1 - block.rect.x0) * scale;
                    const height = (block.rect.y1 - block.rect.y0) * scale;
                    const active = block.id === selectedBlockId;

                    return (
                      <button
                        key={block.id}
                        type="button"
                        className={cn(
                          "pointer-events-auto absolute rounded border transition",
                          active
                            ? "border-accent bg-accent/20 shadow-[0_0_0_2px_rgba(46,132,255,0.2)]"
                            : "border-cyan-500/40 bg-cyan-400/10 hover:bg-cyan-300/20"
                        )}
                        style={{ left, top, width: Math.max(width, 8), height: Math.max(height, 8) }}
                        onClick={() => onSelectBlock(block)}
                        title={block.text}
                      />
                    );
                  })}

                  {activeBlock && activeRect ? (
                    <>
                      <div
                        className="pointer-events-auto absolute cursor-move rounded border-2 border-blue-500/80 bg-blue-100/15"
                        style={{
                          left: activeRect.x0 * scale,
                          top: activeRect.y0 * scale,
                          width: Math.max((activeRect.x1 - activeRect.x0) * scale, 8),
                          height: Math.max((activeRect.y1 - activeRect.y0) * scale, 8),
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setDrag({
                            mode: "move",
                            startX: event.clientX,
                            startY: event.clientY,
                            startRect: activeRect,
                            scale,
                            pageWidth,
                            pageHeight,
                          });
                        }}
                      />
                      {(["nw", "ne", "sw", "se"] as ResizeHandle[]).map((handle) => {
                        const size = 12;
                        const left = (handle.includes("w") ? activeRect.x0 : activeRect.x1) * scale - size / 2;
                        const top = (handle.includes("n") ? activeRect.y0 : activeRect.y1) * scale - size / 2;
                        return (
                          <button
                            key={handle}
                            type="button"
                            className="pointer-events-auto absolute h-3 w-3 rounded-full border border-white bg-blue-600"
                            style={{ left, top }}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              setDrag({
                                mode: "resize",
                                handle,
                                startX: event.clientX,
                                startY: event.clientY,
                                startRect: activeRect,
                                scale,
                                pageWidth,
                                pageHeight,
                              });
                            }}
                          />
                        );
                      })}
                    </>
                  ) : null}

                  {draft && draft.page === pageIndex ? (
                    <div
                      className="absolute overflow-hidden rounded border border-blue-500/60 bg-white/75 p-[2px] text-black"
                      style={{
                        left: draft.rect.x0 * scale,
                        top: draft.rect.y0 * scale,
                        width: Math.max((draft.rect.x1 - draft.rect.x0) * scale, 8),
                        height: Math.max((draft.rect.y1 - draft.rect.y0) * scale, 8),
                        fontSize: Math.max(8, draft.fontSize * scale),
                        fontWeight: draft.bold ? 700 : 400,
                        lineHeight: 1.25,
                        fontFamily: draft.font,
                      }}
                    >
                      <textarea
                        value={draft.text}
                        onChange={(event) => onDraftTextChange(event.target.value)}
                        className="h-full w-full resize-none border-none bg-transparent p-0 outline-none"
                        style={{
                          fontSize: Math.max(8, draft.fontSize * scale),
                          fontWeight: draft.bold ? 700 : 400,
                          lineHeight: 1.25,
                          fontFamily: draft.font,
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Document>
    </Card>
  );
}
