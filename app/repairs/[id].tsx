import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  fetchRepair,
  updateRepair,
} from '@/src/services/repair.service';

type RepairStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'cancelled';

export default function RepairDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [repair, setRepair] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRepair();
  }, []);

  const loadRepair = async () => {
    try {
      setLoading(true);
      const data = await fetchRepair(Number(id));
      setRepair(data);
    } catch {
      Alert.alert('Error', 'Unable to load repair');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (status: RepairStatus) => {
    try {
      setSaving(true);
      const updated = await updateRepair(repair.id, { status });
      setRepair(updated);
    } catch {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 8 },
      ]}
    >
      <Text style={styles.title}>Repair #{repair.id}</Text>

      {/* CUSTOMER */}
      <View style={styles.section}>
        <Text style={styles.label}>Customer</Text>
        <Text style={styles.value}>{repair.customer_name}</Text>
        <Text style={styles.value}>{repair.customer_phone}</Text>
      </View>

      {/* DEVICE */}
      <View style={styles.section}>
        <Text style={styles.label}>Device</Text>
        <Text style={styles.value}>{repair.device_model}</Text>
        {repair.imei && (
          <Text style={styles.value}>IMEI: {repair.imei}</Text>
        )}
      </View>

      {/* ISSUE */}
      <View style={styles.section}>
        <Text style={styles.label}>Problem</Text>
        <Text style={styles.value}>
          {repair.problem_description}
        </Text>
      </View>

      {/* STATUS */}
      <View style={styles.section}>
        <Text style={styles.label}>Status</Text>

        <View style={styles.statusRow}>
          {(
            [
              'pending',
              'in_progress',
              'completed',
              'delivered',
              'cancelled',
            ] as RepairStatus[]
          ).map((s) => (
            <Pressable
              key={s}
              disabled={saving}
              onPress={() => changeStatus(s)}
              style={[
                styles.statusBtn,
                repair.status === s && styles.activeStatus,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  repair.status === s && styles.activeText,
                ]}
              >
                {s.replace('_', ' ').toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* COST */}
      <View style={styles.section}>
        <Text style={styles.label}>Total Cost</Text>
        <Text style={styles.value}>
          {Number(repair.total_cost || 0).toFixed(2)} KWD
        </Text>
      </View>

      <Pressable
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  section: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeStatus: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  activeText: {
    color: '#fff',
  },
  backBtn: {
    marginTop: 30,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
});