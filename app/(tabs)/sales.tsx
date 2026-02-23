import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { findProductByBarcode } from '@/src/services/barcode.service';
import { useSalesStore } from '@/src/stores/sales.store';

export default function Sales() {
  const router = useRouter();
  const { barcode } = useLocalSearchParams<{ barcode?: string }>();

  const cart = useSalesStore((s) => s.cart);
  const addItem = useSalesStore((s) => s.addItem);
  const increment = useSalesStore((s) => s.increment);
  const decrement = useSalesStore((s) => s.decrement);
  const total = useSalesStore((s) => s.total());

  const safeTotal = Number(total || 0);

  const openScanner = () => {
    router.push({
      pathname: '/modal',
      params: { returnTo: '/sales' },
    });
  };

  const goToCheckout = () => {
    router.push('/checkout');
  };

  useEffect(() => {
    if (!barcode) return;

    let cancelled = false;

    (async () => {
      try {
        const result = await findProductByBarcode(barcode);

        if (!result || cancelled) {
          alert('Barcode not found');
          return;
        }

        const success = addItem({
          id: result.id,
          name: result.name,
          barcode,
          price: Number(result.price),
          stock: result.stock,
          type: result.type || 'product',
        });

        if (success) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          );
          alert('Stock limit reached');
        }
      } catch (e) {
        alert('Failed to scan product');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [barcode]);

  return (
    <View style={styles.container}>
      {/* TITLE */}
      <Text style={styles.title}>New Sale</Text>

      {/* SCAN BUTTON */}
      <Pressable style={styles.scanButton} onPress={openScanner}>
        <Text style={styles.scanText}>Scan Barcode</Text>
      </Pressable>

      {/* CART */}
      <FlatList
        data={cart}
        keyExtractor={(item) => item.barcode}
        ListEmptyComponent={
          <Text style={styles.empty}>Scan a product to start a sale</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            {/* LEFT: NAME + PRICE */}
            <View style={styles.itemInfo}>
              <Text
                style={styles.itemName}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>
                {item.price.toFixed(2)} KWD
              </Text>
            </View>

            {/* RIGHT: QTY CONTROLS */}
            <View style={styles.qtyRow}>
              <Pressable onPress={() => decrement(item.barcode)}>
                <Text style={styles.qtyBtn}>−</Text>
              </Pressable>

              <Text style={styles.qty}>{item.qty}</Text>

              <Pressable
                onPress={() => {
                  const ok = increment(item.barcode);

                  if (!ok) {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Warning
                    );
                    alert('Stock limit reached');
                  } else {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Text style={styles.qtyBtn}>+</Text>
              </Pressable>
            </View>
          </View>
        )}

      />

      {/* CHECKOUT BAR */}
      <View style={styles.checkoutBar}>
        <Text style={styles.total}>
          Total: {safeTotal.toFixed(2)} KWD
        </Text>

        <Pressable
          style={[
            styles.checkoutBtn,
            !cart.length && styles.disabled,
          ]}
          disabled={!cart.length}
          onPress={goToCheckout}
        >
          <Text style={styles.checkoutText}>Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 120, // space for sticky bar
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  scanButton: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  scanText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    color: '#666',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },

  itemName: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },

  itemPrice: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,      // 👈 NEVER shrink qty controls
  },

  qtyBtn: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 12,
  },

  qty: {
    fontSize: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  checkoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  checkoutBtn: {
    backgroundColor: '#16a34a',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
