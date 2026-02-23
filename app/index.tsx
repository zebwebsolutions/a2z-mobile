import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';

export default function Index() {
  const token = useAuthStore((s) => s.token);

  if (token) {
    return <Redirect href="/(tabs)/sales" />;
  }

  return <Redirect href="/auth/login" />;
}