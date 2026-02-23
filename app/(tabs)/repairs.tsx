import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { fetchRepairs, Repair } from '@/src/services/repair.service';

export default function RepairsScreen() {
  const router = useRouter();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Repair['status'] | null>(null);


  useEffect(() => {
    loadRepairs(1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      loadRepairs(1, true);
    }, 600);

    return () => clearTimeout(t);
  }, [search, statusFilter]);



  const loadRepairs = async (pageNumber = 1, refresh = false) => {
    if (loadingMore || (!hasMore && pageNumber !== 1)) return;

    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const data = await fetchRepairs({
        page: pageNumber,
        search: search || undefined,
        status: statusFilter || undefined,
      });

      setRepairs((prev) =>
        pageNumber === 1 ? data.data : [...prev, ...data.data]
      );

      setPage(data.current_page);
      setHasMore(data.current_page < data.last_page);
    } catch {
      alert('Failed to load repairs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const openRepair = (id: number) => {
    router.push(`/repairs/${id}`);
  };

  const createRepair = () => {
    router.push('/repairs/new');
  };

  const renderStatus = (status: Repair['status']) => {
    const map = {
      pending: styles.pending,
      in_progress: styles.inProgress,
      completed: styles.completed,
      delivered: styles.delivered,
      cancelled: styles.cancelled,
    };

    return (
      <Text style={[styles.status, map[status]]}>
        {status.replace('_', ' ').toUpperCase()}
      </Text>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Repairs</Text>

        <Pressable style={styles.addBtn} onPress={createRepair}>
          <Text style={styles.addText}>+ New</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search repairs..."
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        {['pending', 'in_progress', 'completed', 'delivered'].map((s) => (
          <Pressable
            key={s}
            style={[
              styles.chip,
              statusFilter === s && styles.chipActive,
            ]}
            onPress={() =>
              setStatusFilter((prev) => (prev === s ? null : s as any))
            }
          >
            <Text
              style={[
                styles.chipText,
                statusFilter === s && styles.chipTextActive,
              ]}
            >
              {s.replace('_', ' ').toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={repairs}
        keyExtractor={(item) => item.id.toString()}
        refreshing={refreshing}
        onRefresh={async() => {
          setRefreshing(true);
          setPage(1);
          setHasMore(true);
          await loadRepairs(1, true);
          setRefreshing(false);
        }}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>No repairs found</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => openRepair(item.id)}
          >
            <View style={styles.row}>
              <Text style={styles.device} numberOfLines={1}>
                {item.device_model}
              </Text>
              {renderStatus(item.status)}
            </View>

            <Text style={styles.customer}>
              {item.customer_name} • {item.customer_phone}
            </Text>

            <Text style={styles.issue} numberOfLines={2}>
              {item.problem_description}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  device: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  customer: {
    marginTop: 4,
    fontSize: 14,
    color: '#444',
  },
  issue: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pending: {
    backgroundColor: '#e5e7eb',
    color: '#111',
  },
  inProgress: {
    backgroundColor: '#fde68a',
    color: '#92400e',
  },
  completed: {
    backgroundColor: '#bbf7d0',
    color: '#166534',
  },
  delivered: {
    backgroundColor: '#bbf7d0',
    color: '#166534',
  },
  cancelled: {
    backgroundColor: '#fecaca',
    color: '#7f1d1d',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  search: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },

});