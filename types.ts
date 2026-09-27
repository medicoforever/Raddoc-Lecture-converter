
export enum CorrectionMode {
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
  GEMINI_3_1_PRO = 'gemini_3_1_pro',
}

export enum ProcessingStatus {
  QUEUED = 'queued',
  TRANSCRIBING = 'transcribing',
  ANALYZING = 'analyzing',
  ENHANCING = 'enhancing',
  GENERATING = 'generating',
  COMPLETE = 'complete',
  ERROR = 'error',
  SPLITTING = 'splitting',
  COMBINING = 'combining',
}

export enum GeminiModel {
  GEMINI_3_8_FLASH = 'gemini-3.8-flash',
  GEMINI_3_7_FLASH = 'gemini-3.7-flash',
  GEMINI_3_5_FLASH = 'gemini-3.5-flash',
  GEMINI_3_1_PRO = 'gemini-3.1-pro-preview',
  GEMINI_3_FLASH = 'gemini-3-flash-preview',
  GEMINI_3_PRO = 'gemini-3-pro-preview',
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-2.5-pro',
}

export interface UploadProgressItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  loadedBytes: number;
  totalBytes: number;
  percentage: number;
  status: 'uploading' | 'indexing' | 'completed' | 'error';
  speed?: string;
  errorMessage?: string;
  completedAt?: number;
}

export interface AudioFile {
  id: string;
  file: File;
  status: ProcessingStatus;
  progress: number;
  transcript?: string;
  initialContent?: string;
  finalContent?: string;
  errorMessage?: string;
  isSplit: boolean;
  originalId?: string;
  part?: number;
  groupId?: string;
  size?: number;
}

export interface MergeGroup {
  id: string;
  name: string;
  fileIds: string[];
  status: ProcessingStatus;
  progress: number;
  initialContent?: string;
  finalContent?: string;
  errorMessage?: string;
}
