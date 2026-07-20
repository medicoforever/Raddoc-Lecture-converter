
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
  PRO = 'gemini-2.5-pro',
  FLASH = 'gemini-2.5-flash',
  GEMINI_3_PRO = 'gemini-3-pro-preview',
  GEMINI_3_FLASH = 'gemini-3-flash-preview',
  GEMINI_3_1_PRO = 'gemini-3.1-pro-preview',
  GEMINI_3_5_FLASH = 'gemini-3.5-flash',
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
