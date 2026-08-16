export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface TripFolder {
  id: string;
  name: string;
  description?: string;
  createdTime?: string;
  webViewLink?: string;
  uploaderCount?: number;
  photoCount?: number;
  coverPhotoUrl?: string;
}

export interface UploaderFolder {
  id: string;
  name: string;
  tripFolderId: string;
  photoCount: number;
  createdTime?: string;
}

export interface DrivePhoto {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  webViewLink: string;
  thumbnailLink?: string;
  webContentLink?: string;
  uploaderName: string;
  uploaderFolderId: string;
  tripId: string;
}

export interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  uploaderName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  driveFileId?: string;
  driveViewLink?: string;
}
