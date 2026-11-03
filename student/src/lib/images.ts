import { Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export interface PickedImage {
  /** Displayable URI. On web this is a data: URI so it survives reloads. */
  uri: string;
}

/**
 * Picks (or shoots) a photo and shrinks it so it never blows the browser's
 * ~5 MB storage limit or a slow upload. Returns null if cancelled/denied.
 */
export async function pickImage(opts: {
  source?: 'library' | 'camera';
  maxSize: number;          // longest edge in px
  square?: boolean;
  quality?: number;
}): Promise<PickedImage | null> {
  const { source = 'library', maxSize, square = false, quality = 0.7 } = opts;

  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;
  } else if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;
  }

  const pickerOpts: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
    ...(square ? { aspect: [1, 1] as [number, number] } : {}),
  };
  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(pickerOpts)
    : await ImagePicker.launchImageLibraryAsync(pickerOpts);
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  // In the browser the image library ignores JPEG quality and saves PNGs several
  // times bigger, so shrink and compress with a canvas instead.
  if (Platform.OS === 'web') return { uri: await shrinkInBrowser(asset.uri, maxSize, quality, square) };

  // The web picker often reports no size; without it nothing gets shrunk and a
  // phone photo (~6 MB) is too big to save, so measure the image ourselves.
  let w = asset.width; let h = asset.height;
  if (!w || !h) ({ width: w, height: h } = await measure(asset.uri));
  const scale = w && h ? Math.min(1, maxSize / Math.max(w, h)) : 1;
  const actions: ImageManipulator.Action[] = scale < 1
    ? [{ resize: { width: Math.round(w! * scale), height: Math.round(h! * scale) } }]
    : !w || !h ? [{ resize: { width: maxSize } }] // size still unknown: cap the width
    : [];

  const out = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return { uri: out.uri };
}

function measure(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), () => resolve({ width: 0, height: 0 }));
  });
}

/** Resize to fit maxSize (center-cropped to a square if asked) and encode as JPEG. */
function shrinkInBrowser(uri: string, maxSize: number, quality: number, square: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new (window as any).Image() as HTMLImageElement;
    img.onload = () => {
      const w = img.naturalWidth; const h = img.naturalHeight;
      const side = Math.min(w, h);
      const sx = square ? (w - side) / 2 : 0; const sy = square ? (h - side) / 2 : 0;
      const sw = square ? side : w; const sh = square ? side : h;
      const scale = Math.min(1, maxSize / Math.max(sw, sh));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sw * scale); canvas.height = Math.round(sh * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no canvas')); return; }
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('could not read image'));
    img.src = uri;
  });
}
