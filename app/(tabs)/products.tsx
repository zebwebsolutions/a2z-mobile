import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useSalesStore } from '@/src/stores/sales.store';
import { api } from '@/src/services/api';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

type Product = {
  id: number;
  name: string;
  barcode: string;
  price: number;
  stock: number;
};

export default function ProductsScreen() {
  const router = useRouter();
  const addItem = useSalesStore((s) => s.addItem);

  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);
  const requestInFlightRef = useRef(false);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    fetchProducts('', 1);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchProducts(search, 1);
    }, 400);

    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = async (q = '', pageNumber = 1) => {
    if (requestInFlightRef.current) return;
    if (!hasMoreRef.current && pageNumber !== 1) return;

    try {
      requestInFlightRef.current = true;
      if (!mountedRef.current) return;

      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await api.get('/products', {
        params: {
          search: q || undefined,
          page: pageNumber,
        },
      });

      const newProducts = res.data.data;

      if (!mountedRef.current) return;

      setProducts((prev) => {
        const merged = pageNumber === 1 ? newProducts : [...prev, ...newProducts];
        const byId = new Map<number, Product>();

        for (const product of merged) {
          byId.set(product.id, product);
        }

        return Array.from(byId.values());
      });

      setPage(res.data.current_page);
      setHasMore(res.data.current_page < res.data.last_page);
    } catch (e: any) {
      Alert.alert(
        'Network error',
        e?.response?.data?.message || 'Unable to load products'
      );
    } finally {
      requestInFlightRef.current = false;

      if (!mountedRef.current) return;
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleAdd = (item: Product) => {
    const ok = addItem({
      id: item.id,
      name: item.name,
      barcode: item.barcode,
      price: Number(item.price),
      stock: Number(item.stock),
      type: 'product',
    });

    if (!ok) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>

        <Pressable
          style={styles.newBtn}
          onPress={() => router.push('/products/new')}
        >
          <Text style={styles.newText}>+ Add</Text>
        </Pressable>
      </View>

      {/* SEARCH */}
      <TextInput
        style={styles.search}
        placeholder="Search products..."
        value={search}
        onChangeText={setSearch}
      />

      {/* LIST */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            setPage(1);
            setHasMore(true);
            await fetchProducts(search, 1);
            setRefreshing(false);
          }}
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              fetchProducts(search, page + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Text style={styles.empty}>No products found</Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: '/products/[id]',
                  params: { id: String(item.id) },
                })
              }
            >
              {/* LEFT */}
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>Stock: {item.stock}</Text>
              </View>

              {/* RIGHT */}
              <View style={styles.right}>
                <Text style={styles.price}>
                  {Number(item.price).toFixed(2)} KWD
                </Text>

                <Pressable
                  style={[
                    styles.addBtn,
                    item.stock === 0 && styles.disabled,
                  ]}
                  disabled={item.stock === 0}
                  onPress={() => handleAdd(item)}
                >
                  <Text style={styles.addText}>+</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  newBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newText: {
    color: '#fff',
    fontWeight: '700',
  },
  search: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  info: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  right: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  addBtn: {
    backgroundColor: '#16a34a',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  disabled: {
    backgroundColor: '#ccc',
  },
});
