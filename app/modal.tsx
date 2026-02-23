import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useScanStore } from '@/src/stores/scan.store';
import { useIsFocused } from '@react-navigation/native';

export default function ModalScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const setBarcode = useScanStore((s) => s.setBarcode);
  const isFocused = useIsFocused();

  const params = useLocalSearchParams<{ returnTo?: string }>();

  const returnTo = params.returnTo;

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 10 }}>
          Camera permission is required
        </Text>
        <Pressable onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!isFocused) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'code128'],
        }}
        onMountError={() => {
          alert('Camera failed to start. Please check permissions and try again.');
          router.back();
        }}
        onBarcodeScanned={({ data }) => {
          if (scanned) return;

          setScanned(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

          setBarcode(data);

          if (returnTo === 'back' || !returnTo) {
            router.back();
            return;
          }

          router.navigate({
            pathname: returnTo,
            params: { barcode: data },
          });
        }}
      />

      <Pressable onPress={() => router.back()} style={styles.cancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
  },
  cancel: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 30,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
  },
});
