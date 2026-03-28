// frontend/src/lib/api.ts
import type {
  ApplyPayload,
  ApplyResponse,
  BlocksResponse,
  DeletePayload,
  DeleteResponse,
  UploadResponse,
} from "@/types/pdf";

const API_BASE = "http://localhost:8000/api";

export async function uploadPdf(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/pdf/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload PDF");
  }

  return response.json();
}

export async function fetchBlocks(documentId: string): Promise<BlocksResponse> {
  const response = await fetch(`${API_BASE}/pdf/${documentId}/blocks`);
  if (!response.ok) {
    throw new Error("Failed to fetch text blocks");
  }
  return response.json();
}

export async function applyChange(documentId: string, payload: ApplyPayload): Promise<ApplyResponse> {
  const response = await fetch(`${API_BASE}/pdf/${documentId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to apply text change");
  }

  return response.json();
}

export async function deleteBlock(documentId: string, payload: DeletePayload): Promise<DeleteResponse> {
  const response = await fetch(`${API_BASE}/pdf/${documentId}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to delete block");
  }
  return response.json();
}

export function getPreviewUrl(documentId: string): string {
  return `${API_BASE}/pdf/${documentId}/preview`;
}

export function getDownloadUrl(documentId: string): string {
  return `${API_BASE}/pdf/${documentId}/download`;
}
