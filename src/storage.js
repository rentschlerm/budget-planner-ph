import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'budget-planner-ph:v1';

export async function loadData() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveData(data) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // ignore write errors; data stays in memory for this session
  }
}

export async function clearData() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {}
}
