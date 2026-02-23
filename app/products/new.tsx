import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { api } from '@/src/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductForm from '@/src/components/ProductForm';

export default function NewProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const submit = async (formData: FormData) => {
    try {
      await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
        transformRequest: () => formData,
      });

      Alert.alert('Success', 'Product added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert(
        'Failed',
        e?.response?.data?.message || 'Could not add product'
      );
    }
  };

  return (
    <ProductForm
      mode="create"
      paddingTop={insets.top}
      onSubmit={submit}
    />
  );
}
