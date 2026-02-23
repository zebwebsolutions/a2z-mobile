import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { api } from '@/src/services/api';

type Order = {
  id: number;
  customer_name: string | null;
  customer_phone: string | null;
  total: string;
  status: string;
  payment_method: string;
  created_at: string;
};

export default function OrdersScreen() {
  const router = useRouter();
  const controllerRef = useRef<AbortController | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'cash' | 'card' | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'refunded' | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadOrders(1);
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      loadOrders(1, true);
    }, 800);
    return () => clearTimeout(timer);
  }, [search, dateFilter, paymentFilter, statusFilter]);

  const loadOrders = async (pageNumber = 1, refresh = false) => {
    if (loadingMore || (!hasMore && pageNumber !== 1)) return;

    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      const res = await api.get('/orders', {
        signal: controllerRef.current.signal,
        params: {
          page: pageNumber,
          search: search || undefined,
          date:
            dateFilter === 'today'
              ? 'today'
              : dateFilter === '7days'
              ? 'last_7_days'
              : dateFilter === 'month'
              ? 'this_month'
              : undefined,
          payment: paymentFilter || undefined,
          status: statusFilter || undefined,
        },
      });

      const newOrders = res.data.data;

      setOrders((prev) => {
        const merged = pageNumber === 1 ? newOrders : [...prev, ...newOrders];
        const byId = new Map<number, Order>();

        for (const order of merged) {
          byId.set(order.id, order);
        }

        return Array.from(byId.values());
      });

      setPage(res.data.current_page);
      setHasMore(res.data.current_page < res.data.last_page);
    } catch (error: any) {
      if (error.name === 'CanceledError') return;
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };


  const openReceipt = (orderId: number) => {
    router.push({
      pathname: '/receipt',
      params: { order_id: String(orderId) },
    });
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadOrders();
    } finally {
      setRefreshing(false);
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
    <>
      {/* HEADER - Fixed at top */}
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>

      {/* FILTERS - Fixed below header */}
      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="Search by name, phone, order ID"
          value={search}
          onChangeText={setSearch}
        />

        {/* DATE FILTER */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{...styles.filterRow, padding: 12, paddingBottom: 4, paddingLeft: 0}}
        >
          {[
            { key: 'today', label: 'Today' },
            { key: '7days', label: 'Last 7 days' },
            { key: 'month', label: 'This month' },
          ].map((f) => (
            <Pressable
              key={f.key}
              style={[
                styles.chip,
                dateFilter === f.key && styles.chipActive,
              ]}
              onPress={() =>
                setDateFilter((prev) => (prev === f.key ? null : (f.key as any)))
              }
            >
              <Text
                style={[
                  styles.chipText,
                  dateFilter === f.key && styles.chipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[
              styles.chip,
              dateFilter === null && styles.chipActive,
            ]}
            onPress={() => setDateFilter(null)}
          >
            <Text
              style={[
                styles.chipText,
                dateFilter === null && styles.chipTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>
        </ScrollView>

        {/* PAYMENT FILTER */}
        <View style={[styles.filterRow, { paddingBottom: 4 }]}>
          {['cash', 'card'].map((p) => (
            <Pressable
              key={p}
              style={[
                styles.chip,
                paymentFilter === p && styles.chipActive,
              ]}
              onPress={() =>
                setPaymentFilter(paymentFilter === p ? null : (p as any))
              }
            >
              <Text
                style={[
                  styles.chipText,
                  paymentFilter === p && styles.chipTextActive,
                ]}
              >
                {p === 'cash' ? 'Cash' : 'Card'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* STATUS FILTER */}
        <View style={styles.filterRow}>
          {['pending', 'completed', 'refunded'].map((s) => (
            <Pressable
              key={s}
              style={[
                styles.chip,
                statusFilter === s && styles.chipActive,
              ]}
              onPress={() =>
                setStatusFilter(statusFilter === s ? null : (s as any))
              }
            >
              <Text
                style={[
                  styles.chipText,
                  statusFilter === s && styles.chipTextActive,
                ]}
              >
                {s === 'pending' ? 'Pending' : s === 'completed' ? 'Completed' : 'Refunded'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ORDERS LIST - Scrollable */}
      <FlatList
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={() => {
          if(hasMore && !loadingMore) {
            loadOrders(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <Text
              style={{
                textAlign: 'center',
                marginTop: 40,
                color: '#666',
              }}
            >
              No orders found
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => openReceipt(item.id)}
          >
            <View style={styles.row}>
              <Text style={styles.orderId}>#{item.id}</Text>
              <Text
                style={[
                  styles.status,
                  item.status !== 'completed' && styles.statusRefunded,
                ]}
              >
                {item.status.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.customer}>
              {item.customer_name || 'Walk-in customer'}
            </Text>

            <View style={styles.row}>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
              <Text style={styles.total}>
                {Number(item.total).toFixed(2)} KWD
              </Text>
            </View>
          </Pressable>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  filters: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  search: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
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
    fontSize: 13,
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontWeight: '700',
    fontSize: 15,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  refunded: {
    color: '#dc2626',
  },
  customer: {
    marginVertical: 6,
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  total: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusRefunded: {
    color: '#dc2626',
  },
});
