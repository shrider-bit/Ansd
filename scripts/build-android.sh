#!/usr/bin/env bash
# Builds the Android APK with Capacitor. Used by GitHub Actions; needs Java 21
# and the Android SDK (both preinstalled on GitHub's ubuntu runners).
#
# Signing: if ANDROID_KEYSTORE_BASE64 (+ ANDROID_KEYSTORE_PASSWORD,
# ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD) are set, a signed release APK is
# built. Otherwise a debug-signed APK is built.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -d dist ] || npm run build:client
[ -d android ] || npx cap add android
npx cap sync android

# Lock the game to landscape.
manifest=android/app/src/main/AndroidManifest.xml
if ! grep -q 'screenOrientation' "$manifest"; then
  sed -i 's|android:name=".MainActivity"|android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"|' "$manifest"
fi

cd android
chmod +x gradlew
mkdir -p ../release
if [ -n "${ANDROID_KEYSTORE_BASE64:-}" ]; then
  echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > "$PWD/release.keystore"
  ./gradlew --no-daemon assembleRelease \
    -Pandroid.injected.signing.store.file="$PWD/release.keystore" \
    -Pandroid.injected.signing.store.password="$ANDROID_KEYSTORE_PASSWORD" \
    -Pandroid.injected.signing.key.alias="$ANDROID_KEY_ALIAS" \
    -Pandroid.injected.signing.key.password="$ANDROID_KEY_PASSWORD"
  cp app/build/outputs/apk/release/app-release.apk ../release/GrannysHouse.apk
  rm -f release.keystore
else
  ./gradlew --no-daemon assembleDebug
  cp app/build/outputs/apk/debug/app-debug.apk ../release/GrannysHouse.apk
fi
echo "APK: release/GrannysHouse.apk"
