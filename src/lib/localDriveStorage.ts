import { TripFolder, DrivePhoto, UploaderFolder } from '../types';

const LOCAL_TRIPS_KEY = 'trip_vault_local_trips';
const LOCAL_PHOTOS_KEY = 'trip_vault_local_photos';

// In-memory / IndexedDB / LocalStorage hybrid for smooth photo management
export function getLocalTrips(): TripFolder[] {
  try {
    const raw = localStorage.getItem(LOCAL_TRIPS_KEY);
    if (!raw) {
      // Seed sample trip
      const sampleTrip: TripFolder = {
        id: 'trip_sample_1',
        name: '제주도 3박 4일 힐링 여행 🌴',
        description: '친구들과 함께한 푸른 바다와 맛집 탐방 기록',
        createdTime: new Date().toISOString(),
        photoCount: 0,
        uploaderCount: 0,
      };
      localStorage.setItem(LOCAL_TRIPS_KEY, JSON.stringify([sampleTrip]));
      return [sampleTrip];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalTrips(trips: TripFolder[]) {
  try {
    localStorage.setItem(LOCAL_TRIPS_KEY, JSON.stringify(trips));
  } catch (e) {
    console.error('Failed to save local trips', e);
  }
}

export function createLocalTrip(name: string, description?: string): TripFolder {
  const trips = getLocalTrips();
  const newTrip: TripFolder = {
    id: `local_trip_${Date.now()}`,
    name,
    description: description || '',
    createdTime: new Date().toISOString(),
    photoCount: 0,
    uploaderCount: 0,
  };
  trips.unshift(newTrip);
  saveLocalTrips(trips);
  return newTrip;
}

export function deleteLocalTrip(tripId: string) {
  const trips = getLocalTrips().filter((t) => t.id !== tripId);
  saveLocalTrips(trips);
  // Also clean up photos
  const photos = getLocalPhotos().filter((p) => p.tripId !== tripId);
  saveLocalPhotos(photos);
}

export function getLocalPhotos(): DrivePhoto[] {
  try {
    const raw = localStorage.getItem(LOCAL_PHOTOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalPhotos(photos: DrivePhoto[]) {
  try {
    // Keep reasonable size in localStorage
    localStorage.setItem(LOCAL_PHOTOS_KEY, JSON.stringify(photos));
  } catch (e) {
    console.warn('LocalStorage quota limit reached for photo storage', e);
  }
}

export function addLocalPhoto(
  tripId: string,
  uploaderName: string,
  fileName: string,
  dataUrl: string,
  mimeType: string,
  size?: number
): DrivePhoto {
  const photos = getLocalPhotos();
  const uploaderFolderId = `uploader_${uploaderName.toLowerCase().replace(/\s+/g, '_')}`;

  const newPhoto: DrivePhoto = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: fileName,
    mimeType: mimeType || 'image/jpeg',
    size: size ? `${(size / 1024 / 1024).toFixed(2)} MB` : '1.2 MB',
    createdTime: new Date().toISOString(),
    webViewLink: dataUrl,
    thumbnailLink: dataUrl,
    webContentLink: dataUrl,
    uploaderName: uploaderName.trim() || '익명 여행자',
    uploaderFolderId,
    tripId,
  };

  photos.unshift(newPhoto);
  saveLocalPhotos(photos);

  // Update trip counts
  const trips = getLocalTrips();
  const trip = trips.find((t) => t.id === tripId);
  if (trip) {
    const tripPhotos = photos.filter((p) => p.tripId === tripId);
    const uniqueUploaders = new Set(tripPhotos.map((p) => p.uploaderName));
    trip.photoCount = tripPhotos.length;
    trip.uploaderCount = uniqueUploaders.size;
    if (!trip.coverPhotoUrl && dataUrl) {
      trip.coverPhotoUrl = dataUrl;
    }
    saveLocalTrips(trips);
  }

  return newPhoto;
}
