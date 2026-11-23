import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { GITHUB_REPO } from './config';

export function currentVersion() {
  return (Constants.expoConfig && Constants.expoConfig.version) || '0.0.0';
}

function compareVersions(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

// Looks at the latest GitHub Release and returns info about it.
export async function checkForUpdate() {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub responded ${res.status}`);
  const release = await res.json();
  const latest = String(release.tag_name || '').replace(/^v/, '');
  const apk = (release.assets || []).find((a) => a.name && a.name.endsWith('.apk'));
  return {
    current: currentVersion(),
    latest,
    available: !!apk && compareVersions(latest, currentVersion()) > 0,
    url: apk ? apk.browser_download_url : release.html_url,
    notes: release.body || '',
  };
}

function promptInstall(info) {
  const notes = info.notes ? `\n\n${info.notes.slice(0, 400)}` : '';
  Alert.alert(
    'Update available',
    `Version ${info.latest} is ready (you have ${info.current}).${notes}\n\nTap Download, then open the APK to install it. Your data is kept.`,
    [
      { text: 'Later', style: 'cancel' },
      { text: 'Download', onPress: () => Linking.openURL(info.url) },
    ]
  );
}

// Called automatically when the app opens. Silent unless there's an update.
export async function autoCheckForUpdate() {
  if (__DEV__ || Platform.OS !== 'android') return;
  try {
    const info = await checkForUpdate();
    if (info.available) promptInstall(info);
  } catch (e) {
    // offline or GitHub unreachable — try again next launch
  }
}

// Called from the "Check for updates" button. Always reports the result.
export async function manualCheckForUpdate() {
  try {
    const info = await checkForUpdate();
    if (info.available) promptInstall(info);
    else Alert.alert("You're up to date", `Version ${info.current} is the latest.`);
  } catch (e) {
    Alert.alert("Couldn't check for updates", 'Check your internet connection and try again.');
  }
}
