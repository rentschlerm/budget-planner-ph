# Budget Planner PH

An Expo (React Native) budget app for moving out and living on your own in the Philippines. It runs on Android and iOS.

## Features
- **Home:** income, spent, and what's left for the month. Shows a per-payday split (1st–15th and 16th–end), a 50/30/20 check, and per-category progress bars. Tap a category to log spending in it.
- **Expenses:** month-by-month history grouped by day. Tap an entry to edit or delete it.
- **Budget:** set your take-home pay and pay schedule (15th & 30th or monthly). Add, edit or delete categories with an icon and a Needs/Wants/Savings type.
- **Move-in fund:** checklist of one-time costs (advance rent, deposit, bed, rice cooker, Lalamove…). It tracks how much is paid or saved and estimates how many months it will take to fund the rest.
- Everything is saved on the phone (AsyncStorage). No account or internet needed.

The starter amounts are placeholders. Change them to your real rent, bills and salary.

## Run it
```bash
npm install
npx expo install --fix   # aligns package versions with your Expo SDK
npx expo start
```
Scan the QR code with the **Expo Go** app on your Android phone.

## Get the APK from GitHub (recommended)
1. Create a **public** repo named `budget-planner-ph` on GitHub. If you use another name, update `src/config.js`.
2. Push this folder to its `main` branch.
3. Open the **Actions** tab. "Build Android APK" runs automatically and takes about 10–15 minutes.
4. Open **Releases** on your phone, download `budget-planner-1.0.X.apk`, and install it. Allow "Install unknown apps" if Android asks.

### Auto-updates
Every push to `main` builds a new release with a higher version number (`1.0.<build number>`).
When the app opens, it checks the latest GitHub Release. If a newer version is there, it asks you to download it.
Installing the new APK on top of the old one keeps your data. You can also tap **Budget → Check for updates**.

Builds are signed with the standard Expo/React Native debug key, so every build has the same signature and updates install cleanly. That's fine for personal use. Use your own signing key before publishing to the Play Store.

## Alternative: build with Expo's servers (EAS)
`eas.json` is already set up so the `preview` profile builds an `.apk`.
```bash
npm install
npx expo install --fix
npm install -g eas-cli
eas login                                # free account at expo.dev
eas build -p android --profile preview
```
When it finishes (about 10–20 min), EAS shows a link and QR code. Open it on your phone, download the APK, and allow "Install unknown apps" when Android asks.

## Project layout
```
App.js                  tabs, state, add-expense button
src/defaults.js         starter categories & move-in checklist
src/storage.js          AsyncStorage save/load
src/components.js       progress bar, modals, chips
src/screens/            Home, Expenses, Budget, Move-in
```
