// frontend/src/types/pdf.ts
export type BlockRect = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

export type TextBlock = {
  id: string;
  page: number;
  rect: BlockRect;
  text: string;
  font: string;
  size: number;
};

export type PageLayout = {
  page: number;
  width: number;
  height: number;
};

export type UploadResponse = {
  document_id: string;
  filename: string;
};

export type BlocksResponse = {
  document_id: string;
  page_count: number;
  pages: PageLayout[];
  blocks: TextBlock[];
};

export type ApplyPayload = {
  page: number;
  block_id: string;
  rect: BlockRect;
  text: string;
  font: string;
  font_size: number;
  bold: boolean;
  clear_old: boolean;
};

export type ApplyResponse = {
  document_id: string;
  applied: boolean;
  warnings: string[];
};

export type DeletePayload = {
  page: number;
  rect: BlockRect;
};

export type DeleteResponse = {
  document_id: string;
  deleted: boolean;
};

export type EditorDraft = {
  blockId: string;
  page: number;
  rect: BlockRect;
  text: string;
  font: string;
  fontSize: number;
  bold: boolean;
};
