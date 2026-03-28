// frontend/src/components/pdf/BlockEditor.tsx
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import type { BlockRect, EditorDraft, TextBlock } from "@/types/pdf";

type BlockEditorProps = {
  block: TextBlock | null;
  draftRect: BlockRect | null;
  draftTextFromCanvas: string | null;
  saving: boolean;
  warnings: string[];
  addTextMode: boolean;
  onApply: (payload: { text: string; font: string; fontSize: number; bold: boolean }) => Promise<void>;
  onDelete: () => Promise<void>;
  onDraftChange: (draft: EditorDraft | null) => void;
  onScaleRect: (factor: number) => void;
  onToggleAddTextMode: () => void;
  onDownload: () => void;
};

const FONT_OPTIONS = ["Helvetica", "Arial", "Times-Roman", "Courier"];

export function BlockEditor({
  block,
  draftRect,
  draftTextFromCanvas,
  saving,
  warnings,
  addTextMode,
  onApply,
  onDelete,
  onDraftChange,
  onScaleRect,
  onToggleAddTextMode,
  onDownload,
}: BlockEditorProps) {
  const [text, setText] = useState("");
  const [font, setFont] = useState("Helvetica");
  const [fontSize, setFontSize] = useState(11);
  const [bold, setBold] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (!block) {
      onDraftChange(null);
      return;
    }
    setText(block.text);
    setFont(block.font || "Helvetica");
    setFontSize(Math.max(6, Math.round(block.size)));
    setBold(false);
  }, [block, onDraftChange]);

  useEffect(() => {
    if (draftTextFromCanvas !== null) {
      setText(draftTextFromCanvas);
    }
  }, [draftTextFromCanvas]);

  useEffect(() => {
    if (!block || !draftRect) {
      return;
    }
    onDraftChange({
      blockId: block.id,
      page: block.page,
      rect: draftRect,
      text,
      font,
      fontSize,
      bold,
    });
  }, [block, draftRect, text, font, fontSize, bold, onDraftChange]);

  const originalText = useMemo(() => block?.text ?? "", [block]);

  return (
    <Card className="h-[calc(100vh-220px)] overflow-auto p-5">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text">{t("editor.title")}</h3>
          <p className="text-sm text-slate-600">{t("editor.subtitle")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={addTextMode ? "default" : "secondary"} onClick={onToggleAddTextMode}>
            {addTextMode ? t("editor.addTextMode") : t("editor.addText")}
          </Button>
          <Button variant="ghost" onClick={onDownload}>
            {t("editor.download")}
          </Button>
        </div>

        {block ? (
          <>
            <div className="space-y-2">
              <Label>{t("editor.original")}</Label>
              <Textarea value={originalText} readOnly className="min-h-[90px]" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-text">{t("editor.new")}</Label>
              <Textarea id="new-text" value={text} onChange={(event) => setText(event.target.value)} />
              <p className="text-xs text-slate-500">{t("editor.boldHint")}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("editor.fontFamily")}</Label>
                <Select value={font} onValueChange={setFont}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("editor.fontFamily")} />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">{t("editor.fontSize")}</Label>
                <Input
                  id="font-size"
                  type="number"
                  min={6}
                  max={72}
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/55 px-3 py-2 text-sm text-text">
              <input
                type="checkbox"
                checked={bold}
                onChange={(event) => setBold(event.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              {t("editor.boldAll")}
            </label>

            <div className="rounded-xl border border-white/40 bg-white/55 p-3">
              <Label>{t("editor.scale")}</Label>
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => onScaleRect(0.9)}>
                  -10%
                </Button>
                <Button type="button" variant="secondary" onClick={() => onScaleRect(1.1)}>
                  +10%
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">{t("editor.scaleHint")}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => onApply({ text, font, fontSize, bold })}
                disabled={saving || !text.trim()}
                className="min-w-[140px]"
              >
                {saving ? t("editor.applying") : t("editor.apply")}
              </Button>
              <Button variant="danger" onClick={onDelete} disabled={saving}>
                {t("editor.delete")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (block) {
                    setText(block.text);
                    setFont(block.font || "Helvetica");
                    setFontSize(Math.max(6, Math.round(block.size)));
                    setBold(false);
                    onScaleRect(1);
                  }
                }}
              >
                {t("editor.reset")}
              </Button>
            </div>

            {!!warnings.length && (
              <div className="space-y-2 rounded-xl border border-amber-300/70 bg-amber-100/65 p-3">
                <Badge className="bg-amber-200/70">{t("editor.warnings")}</Badge>
                {warnings.map((warning) => (
                  <p className="text-sm text-amber-900" key={warning}>
                    {warning}
                  </p>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-white/50 bg-white/40 p-4 text-sm text-slate-600">{t("editor.noBlock")}</p>
        )}
      </div>
    </Card>
  );
}
