import { Platform } from 'react-native';
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
  const w = asset.width || maxSize;
  const h = asset.height || maxSize;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const actions: ImageManipulator.Action[] = scale < 1
    ? [{ resize: { width: Math.round(w * scale), height: Math.round(h * scale) } }]
    : [];

  const out = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: Platform.OS === 'web',
  });
  const uri = Platform.OS === 'web' && out.base64 ? `data:image/jpeg;base64,${out.base64}` : out.uri;
  return { uri };
}
