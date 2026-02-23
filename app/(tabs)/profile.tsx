import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { api } from '@/src/services/api';
import { useAuthStore } from '@/src/store/auth.store';

type Profile = {
  name: string;
  email: string;
  phone: string;
  role: string;
  store?: {
    id: number;
    name: string;
  };
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/me')
      .then((res) => setProfile(res.data))
      .catch(() => Alert.alert('Error', 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

    const handleLogout = async () => {
        Alert.alert(
            'Log out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log out',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/auth/login');
                    },
                },
            ]
        );
    };


  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
     <Text style={styles.title}>Profile</Text>
      {/* USER CARD */}
      <View style={styles.card}>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.role}>{profile.role.toUpperCase()}</Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Email</Text>
        <Text>{profile.email}</Text>

        <Text style={styles.label}>Phone</Text>
        <Text>{profile.phone}</Text>

        <Text style={styles.label}>Store</Text>
        <Text>{profile.store?.name ?? '—'}</Text>
      </View>

      {/* ACTIONS */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  role: {
    marginTop: 4,
    color: '#2563eb',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  label: {
    marginTop: 8,
    fontWeight: '600',
    color: '#555',
  },
  logoutBtn: {
    marginTop: 24,
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

