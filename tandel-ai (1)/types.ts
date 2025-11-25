export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  attachments?: Attachment[];
  isStreaming?: boolean;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
  pinned?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}