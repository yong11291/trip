import { TripFolder, UploaderFolder, DrivePhoto } from '../types';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
export const APP_ROOT_FOLDER_NAME = '여행 사진 저장소';

interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  size?: string;
  createdTime?: string;
  parents?: string[];
}

/**
 * Searches for a folder or creates it if it doesn't exist
 */
export async function getOrCreateFolder(
  accessToken: string,
  folderName: string,
  parentId?: string,
  description?: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  } else {
    query += ` and 'root' in parents`;
  }

  const searchUrl = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,createdTime)&spaces=drive`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Google Drive 폴더 검색 실패 (${searchRes.status}): ${errorText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0];
  }

  // Create folder
  const body: Record<string, unknown> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    body.parents = [parentId];
  }
  if (description) {
    body.description = description;
  }

  const createRes = await fetch(`${DRIVE_API_BASE}/files?fields=id,name,webViewLink,createdTime`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Google Drive 폴더 생성 실패 (${createRes.status}): ${errorText}`);
  }

  return await createRes.json();
}

/**
 * Ensure root '여행 사진 저장소' folder exists
 */
export async function getAppRootFolder(accessToken: string): Promise<{ id: string; name: string; webViewLink?: string }> {
  return await getOrCreateFolder(accessToken, APP_ROOT_FOLDER_NAME, undefined, '여행 사진 저장소 웹앱에서 자동 생성된 여행 앨범 모음 폴더');
}

/**
 * Get all trip folders inside app root
 */
export async function getTripFolders(accessToken: string): Promise<TripFolder[]> {
  const root = await getAppRootFolder(accessToken);
  const query = `'${root.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,description,webViewLink,createdTime)&orderBy=createdTime desc&pageSize=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`여행 폴더 목록 불러오기 실패 (${res.status})`);
  }

  const data = await res.json();
  const rawFolders: DriveFileItem[] = data.files || [];

  // Fetch summary details for each trip folder
  const trips: TripFolder[] = await Promise.all(
    rawFolders.map(async (folder) => {
      try {
        // Query uploader subfolders
        const subquery = `'${folder.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const subRes = await fetch(`${DRIVE_API_BASE}/files?q=${encodeURIComponent(subquery)}&fields=files(id,name)&pageSize=50`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const subData = await subRes.json();
        const uploaderFolders = subData.files || [];

        return {
          id: folder.id,
          name: folder.name,
          description: folder.description || '',
          createdTime: folder.createdTime,
          webViewLink: folder.webViewLink,
          uploaderCount: uploaderFolders.length,
        };
      } catch {
        return {
          id: folder.id,
          name: folder.name,
          description: folder.description || '',
          createdTime: folder.createdTime,
          webViewLink: folder.webViewLink,
          uploaderCount: 0,
        };
      }
    })
  );

  return trips;
}

/**
 * Create a new trip folder
 */
export async function createTripFolder(
  accessToken: string,
  tripName: string,
  description?: string
): Promise<TripFolder> {
  const root = await getAppRootFolder(accessToken);
  const created = await getOrCreateFolder(accessToken, tripName.trim(), root.id, description);
  return {
    id: created.id,
    name: created.name,
    description: description || '',
    webViewLink: created.webViewLink,
    uploaderCount: 0,
    photoCount: 0,
    createdTime: new Date().toISOString(),
  };
}

/**
 * Delete a trip folder (Requires user confirmation)
 */
export async function deleteTripFolder(accessToken: string, folderId: string): Promise<void> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${folderId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`여행 폴더 삭제 실패: ${err}`);
  }
}

/**
 * Get or create an uploader's personal folder inside a trip folder
 */
export async function getOrCreateUploaderFolder(
  accessToken: string,
  tripFolderId: string,
  uploaderName: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const cleanName = uploaderName.trim() || '익명 참여자';
  return await getOrCreateFolder(accessToken, cleanName, tripFolderId, `${cleanName} 님이 업로드한 사진 폴더`);
}

/**
 * Get all uploader folders inside a trip
 */
export async function getTripUploaders(accessToken: string, tripFolderId: string): Promise<UploaderFolder[]> {
  const query = `'${tripFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime)&orderBy=name asc&pageSize=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`참여자 목록 불러오기 실패 (${res.status})`);
  }

  const data = await res.json();
  const folders: DriveFileItem[] = data.files || [];

  return folders.map((f) => ({
    id: f.id,
    name: f.name,
    tripFolderId: tripFolderId,
    photoCount: 0,
    createdTime: f.createdTime,
  }));
}

/**
 * Upload a single photo file to Google Drive using multipart upload
 */
export async function uploadPhotoFile(
  accessToken: string,
  folderId: string,
  file: File,
  uploaderName: string,
  onProgress?: (percent: number) => void
): Promise<DrivePhoto> {
  return new Promise((resolve, reject) => {
    const boundary = '-------TripPhotoVault' + Math.random().toString(36).substring(2);
    const delimiter = '\r\n--' + boundary + '\r\n';
    const closeDelim = '\r\n--' + boundary + '--';

    const contentType = file.type || 'image/jpeg';
    const metadata = {
      name: file.name,
      mimeType: contentType,
      parents: [folderId],
      description: `[여행 사진 저장소] 올린 사람: ${uploaderName}`,
    };

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.onload = () => {
      const fileArrayBuffer = reader.result as ArrayBuffer;

      const metadataPart = delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) + '\r\n';

      const fileHeader = delimiter + `Content-Type: ${contentType}\r\n\r\n`;

      const requestBlob = new Blob([
        metadataPart,
        fileHeader,
        fileArrayBuffer,
        closeDelim,
      ], { type: `multipart/related; boundary=${boundary}` });

      const xhr = new XMLHttpRequest();
      xhr.open(
        'POST',
        `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,thumbnailLink,webContentLink,size,createdTime`
      );
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const uploadedFile: DriveFileItem = JSON.parse(xhr.responseText);
            resolve({
              id: uploadedFile.id,
              name: uploadedFile.name,
              mimeType: uploadedFile.mimeType,
              size: uploadedFile.size,
              createdTime: uploadedFile.createdTime || new Date().toISOString(),
              webViewLink: uploadedFile.webViewLink || '',
              thumbnailLink: uploadedFile.thumbnailLink,
              webContentLink: uploadedFile.webContentLink,
              uploaderName: uploaderName,
              uploaderFolderId: folderId,
              tripId: '',
            });
          } catch (e) {
            reject(new Error(`응답 처리 실패: ${e}`));
          }
        } else {
          reject(new Error(`업로드 실패 (${xhr.status}): ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => reject(new Error('네트워크 오류로 업로드에 실패했습니다.'));
      xhr.send(requestBlob);
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get all photos in a trip across all uploader subfolders
 */
export async function getTripPhotos(accessToken: string, tripFolderId: string): Promise<{ photos: DrivePhoto[]; uploaders: UploaderFolder[] }> {
  // 1. Get all uploader folders in this trip
  const uploaders = await getTripUploaders(accessToken, tripFolderId);

  if (uploaders.length === 0) {
    return { photos: [], uploaders: [] };
  }

  // 2. Query photos inside each uploader folder
  const photoPromises = uploaders.map(async (uploader) => {
    try {
      const query = `'${uploader.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
      const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,webViewLink,thumbnailLink,webContentLink)&orderBy=createdTime desc&pageSize=100`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) return { uploaderId: uploader.id, count: 0, photos: [] };

      const data = await res.json();
      const files: DriveFileItem[] = data.files || [];

      const photos: DrivePhoto[] = files.map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        createdTime: f.createdTime || '',
        webViewLink: f.webViewLink || '',
        thumbnailLink: f.thumbnailLink,
        webContentLink: f.webContentLink,
        uploaderName: uploader.name,
        uploaderFolderId: uploader.id,
        tripId: tripFolderId,
      }));

      return { uploaderId: uploader.id, count: photos.length, photos };
    } catch {
      return { uploaderId: uploader.id, count: 0, photos: [] };
    }
  });

  const results = await Promise.all(photoPromises);

  const updatedUploaders = uploaders.map((u) => {
    const res = results.find((r) => r.uploaderId === u.id);
    return { ...u, photoCount: res ? res.count : 0 };
  });

  const allPhotos: DrivePhoto[] = results.flatMap((r) => r.photos);
  // Sort photos newest first
  allPhotos.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());

  return { photos: allPhotos, uploaders: updatedUploaders };
}

/**
 * Delete a photo from Google Drive (Requires explicit confirmation modal)
 */
export async function deleteDrivePhoto(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`사진 삭제 실패: ${err}`);
  }
}
