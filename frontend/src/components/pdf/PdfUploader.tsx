// frontend/src/components/pdf/PdfUploader.tsx
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PdfUploaderProps = {
  loading: boolean;
  onUpload: (file: File) => Promise<void>;
};

export function PdfUploader({ loading, onUpload }: PdfUploaderProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Upload PDF</h2>
          <p className="text-sm text-slate-600">Only digital text PDFs are supported. No OCR in MVP.</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) {
                await onUpload(file);
                event.currentTarget.value = "";
              }
            }}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={loading}>
            {loading ? "Uploading..." : "Select PDF"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
