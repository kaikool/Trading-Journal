// Firebase Storage interfaces 
export interface StorageMetadata {
  bucket: string;
  contentType?: string;
  fullPath: string;
  generation: string;
  md5Hash?: string;
  metageneration: string;
  name: string;
  size: number;
  timeCreated: string;
  updated: string;
}

export interface StorageReference {
  bucket: string;
  fullPath: string;
  name: string;
}

export interface UploadTaskSnapshot {
  bytesTransferred: number;
  metadata: StorageMetadata;
  ref: StorageReference;
  state: string; 
  task: any;
  totalBytes: number;
}

export interface FirebaseStorageError {
  code: string;
  message: string;
  name: string;
  serverResponse?: string;
}