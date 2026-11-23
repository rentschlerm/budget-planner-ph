import * as ImagePicker from 'expo-image-picker';
import { parseReceipt } from './receiptParser';

let extractor = null;
try {
  // Native ML Kit module — available in the built APK, not in Expo Go.
  extractor = require('expo-text-extractor');
} catch (e) {
  extractor = null;
}

export const scanSupported = !!(extractor && extractor.isSupported !== false);

// source: 'camera' | 'library'. Returns an image uri, or null if the user cancelled.
export async function pickReceiptImage(source) {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      const err = new Error('Camera permission denied');
      err.code = 'permission';
      throw err;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
    return res.canceled ? null : res.assets[0].uri;
  }
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
  return res.canceled ? null : res.assets[0].uri;
}

export async function readReceipt(uri, categories) {
  if (!scanSupported) throw new Error('Text recognition is not available on this device');
  const blocks = await extractor.extractTextFromImage(uri);
  return parseReceipt(blocks || [], categories);
}
