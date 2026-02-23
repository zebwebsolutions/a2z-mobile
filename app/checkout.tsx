import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSalesStore } from '@/src/stores/sales.store';
import { submitOrder } from '@/src/services/order.service'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, total, clearCart } = useSalesStore();
  const insets = useSafeAreaInsets(); 

  const safeTotal = Number(total() || 0);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerType, setCustomerType] = useState<'vip' | 'good' | 'normal' | 'bad'>('normal');
  const [receiptLanguage, setReceiptLanguage] = useState<'en' | 'ar'>('en');
  const [discount, setDiscount] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<'cash' | 'card' | null>(null);

  const validate = () => {
    if (!customerName.trim()) {
      Alert.alert('Missing info', 'Customer name is required');
      return false;
    }

    if (!customerPhone.trim()) {
      Alert.alert('Missing info', 'Customer phone is required');
      return false;
    }

    if (cart.length === 0) {
      Alert.alert('Empty cart', 'Add at least one product');
      return false;
    }

    return true;
  };

  const numericDiscount = Math.max(0, Number(discount) || 0);
  const finalTotal = Math.max(0, safeTotal - numericDiscount);

  const checkout = async (paymentMethod: 'cash' | 'card') => {
    if (loading || !validate()) return;

    try {
      setProcessingMethod(paymentMethod);
      setLoading(true);

      const result = await submitOrder({
        payment_method: paymentMethod,
        total: finalTotal,
        discount: numericDiscount,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_type: customerType,
        receipt_language: receiptLanguage,
        items: cart.map(item => ({
          id: item.id,
          price: item.price,
          qty: item.qty,
        })),
      });

      clearCart();

      router.replace({
        pathname: '/receipt',
        params: {
          order_id: result.order_id,
          total: safeTotal,
          payment_method: paymentMethod,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_type: customerType,
          receipt_language: receiptLanguage,
          discount: numericDiscount,
          items: JSON.stringify(
            cart.map(i => ({
              name: i.name,
              qty: i.qty,
              price: i.price,
            }))
          ),
        },
      });

    } catch (e: any) {
      Alert.alert(
        'Checkout failed',
        e?.response?.data?.message || 'Insufficient stock'
      );
    } finally {
      setLoading(false);
      setProcessingMethod(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Checkout</Text>

      <Text style={styles.label}>Customer Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter customer name"
        value={customerName}
        onChangeText={setCustomerName}
      />

      <Text style={styles.label}>Customer Phone *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter customer phone"
        keyboardType="phone-pad"
        value={customerPhone}
        onChangeText={setCustomerPhone}
      />

      <Text style={styles.label}>Customer Type</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={customerType}
          onValueChange={(value) => setCustomerType(value)}
        >
          <Picker.Item label="VIP" value="vip" />
          <Picker.Item label="Good" value="good" />
          <Picker.Item label="Normal" value="normal" />
          <Picker.Item label="Bad" value="bad" />
        </Picker>
      </View>

      <Text style={styles.label}>Discount (KD)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={discount}
        onChangeText={setDiscount}
      />

      <Text style={styles.label}>Receipt Language</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={receiptLanguage}
          onValueChange={(value) => setReceiptLanguage(value)}
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="Arabic" value="ar" />
        </Picker>
      </View>

      <View style={styles.summary}>
        <Text style={styles.total}>
          Total: {finalTotal.toFixed(2)} KWD
        </Text>
      </View>

      <Pressable
        style={[
          styles.button,
          styles.cash,
          loading && processingMethod !== 'cash' ? styles.buttonDisabled : null,
        ]}
        disabled={loading}
        onPress={() => checkout('cash')}
      >
        <Text style={styles.buttonText}>
          {processingMethod === 'cash' ? 'Processing...' : 'Cash Payment'}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.button,
          styles.card,
          loading && processingMethod !== 'card' ? styles.buttonDisabled : null,
        ]}
        disabled={loading}
        onPress={() => checkout('card')}
      >
        <Text style={styles.buttonText}>
          {processingMethod === 'card' ? 'Processing...' : 'Card Payment'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  summary: {
    marginVertical: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  total: {
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  cash: {
    backgroundColor: '#16a34a',
  },
  card: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
