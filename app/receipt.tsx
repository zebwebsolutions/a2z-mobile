import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/src/services/api';

export default function ReceiptScreen() {
  const { order_id, discount } = useLocalSearchParams<{ order_id: string; discount?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    try {
      const res = await api.get(`/orders/${order_id}`);
      setOrder(res.data);
    } catch {
      Alert.alert('Error', 'Unable to load receipt');
      router.replace('/(tabs)/sales');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    Alert.alert(
      'Confirm refund',
      'Are you sure you want to refund this order?',
      [
        { text: 'No' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/orders/${order_id}/refund`);
              Alert.alert('Refunded', 'Order refunded successfully');
              loadOrder();
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.message || 'Refund failed'
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!order) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={{...styles.title, paddingTop:
                Platform.OS === 'android'
                  ? StatusBar.currentHeight
                  : insets.top,}}>🧾 Receipt</Text>

      <View style={styles.card}>
        <Text style={styles.meta}>Order #{order.id}</Text>
        <Text style={styles.meta}>
          {new Date(order.created_at).toLocaleString()}
        </Text>

        <View style={styles.divider} />

        <Text><Text style={styles.label}>Customer:</Text> {order.customer_name}</Text>
        <Text><Text style={styles.label}>Phone:</Text> {order.customer_phone}</Text>
        {order.customer_type && (
          <Text>
            <Text style={styles.label}>Type:</Text>{" "}
            {String(order.customer_type).toUpperCase()}
          </Text>
        )}
        <Text>
          <Text style={styles.label}>Payment:</Text>{" "}
          {String(order.payment_method ?? '').toUpperCase()}
        </Text>
        <Text><Text style={styles.label}>Status:</Text> {order.status}</Text>

        <View style={styles.divider} />

        {order.items.map((item: any) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.product.name} × {item.quantity}</Text>
            <Text style={styles.itemPrice}>{(item.price * item.quantity).toFixed(2)} KWD</Text>
          </View>
        ))}

        <View style={styles.divider} />

        {Number(discount) > 0 && (
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>Discount</Text>
            <Text style={styles.itemPrice}>
              -{Number(discount).toFixed(2)} KWD
            </Text>
          </View>
        )}

        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {Number(order.total).toFixed(2)} KWD
          </Text>
        </View>
      </View>

      {order.status === 'completed' && (
        <Pressable style={[styles.button, styles.refund]} onPress={handleRefund}>
          <Text style={styles.buttonText}>Refund / Cancel</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.button}
        onPress={() => router.replace('/(tabs)/sales')}
      >
        <Text style={styles.buttonText}>New Sale</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
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
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  meta: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  row: {
    fontSize: 14,
    marginBottom: 6,
  },
  label: {
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    flex: 72,
  },
  itemPrice: {
    fontSize: 14,
    flex: 28,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  refund: {
    backgroundColor: '#dc2626',
  },
});
