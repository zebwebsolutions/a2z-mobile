import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createRepair } from '@/src/services/repair.service';

const stores = [
  { label: 'LifeStyle', value: 1 },
  { label: 'A2Z', value: 2 },
  { label: 'International Link', value: 3 },
  { label: 'Nada Phone', value: 4 },
];

const statuses = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function NewRepairScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [storeId, setStoreId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [imei, setImei] = useState('');
  const [problem, setProblem] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'>(
    'pending'
  );

  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [parts, setParts] = useState<
    { part_name: string; quantity: string; cost: string }[]
  >([{ part_name: '', quantity: '', cost: '' }]);

  const addPart = () => {
    setParts([...parts, { part_name: '', quantity: '', cost: '' }]);
  };

  const updatePart = (index: number, field: string, value: string) => {
    const updated = [...parts];
    // @ts-ignore
    updated[index][field] = value;
    setParts(updated);
  };

  const submit = async () => {
    if (!storeId || !customerName || !customerPhone || !deviceModel || !problem) {
      Alert.alert('Missing info', 'Please fill required fields');
      return;
    }

    try {
      await createRepair({
        customer_name: customerName,
        customer_phone: customerPhone,
        device_model: deviceModel,
        imei: imei || undefined,
        problem_description: problem,
        total_cost: Number(totalCost),
        status,
        parts: parts
          .filter((p) => p.part_name)
          .map((p) => ({
            part_name: p.part_name,
            quantity: Number(p.quantity) || 1,
            cost: Number(p.cost) || 0,
          })),
      });

      Alert.alert('Success', 'Repair saved');
      router.replace('/(tabs)/repairs');
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'Failed to save repair'
      );
    }
  };

  const selectedStore = stores.find((s) => s.value === storeId);
  const selectedStatus = statuses.find((s) => s.value === status);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 8 },
      ]}
    >
      <Text style={styles.title}>New Repair</Text>

      {/* STORE DROPDOWN */}
      <Text style={styles.label}>Store *</Text>
      <Pressable
        style={styles.dropdownButton}
        onPress={() => setShowStoreDropdown(true)}
      >
        <Text style={[styles.dropdownText, !selectedStore && styles.placeholder]}>
          {selectedStore?.label || 'Select Store'}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </Pressable>

      {/* Store Dropdown Modal */}
      <Modal
        visible={showStoreDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStoreDropdown(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowStoreDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownTitle}>Select Store</Text>
            {stores.map((store) => (
              <TouchableOpacity
                key={store.value}
                style={[
                  styles.dropdownItem,
                  storeId === store.value && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setStoreId(store.value);
                  setShowStoreDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    storeId === store.value && styles.dropdownItemTextSelected,
                  ]}
                >
                  {store.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* CUSTOMER */}
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Customer Name *"
          value={customerName}
          onChangeText={setCustomerName}
        />
        <TextInput
          style={styles.input}
          placeholder="Customer Phone *"
          value={customerPhone}
          onChangeText={setCustomerPhone}
        />
      </View>

      {/* DEVICE */}
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Device Model *"
          value={deviceModel}
          onChangeText={setDeviceModel}
        />
        <TextInput
          style={styles.input}
          placeholder="IMEI (optional)"
          value={imei}
          onChangeText={setImei}
        />
      </View>

      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Problem Description *"
        value={problem}
        onChangeText={setProblem}
        multiline
      />

      {/* PARTS */}
      <Text style={styles.section}>Parts Used</Text>

      {parts.map((part, i) => (
        <View key={i} style={styles.row}>
          <TextInput
            style={[styles.input, styles.partName]}
            placeholder="Part Name"
            value={part.part_name}
            onChangeText={(v) => updatePart(i, 'part_name', v)}
          />
          <TextInput
            style={[styles.input, styles.qty]}
            placeholder="Qty"
            keyboardType="numeric"
            value={part.quantity}
            onChangeText={(v) => updatePart(i, 'quantity', v)}
          />
          <TextInput
            style={[styles.input, styles.cost]}
            placeholder="Cost"
            keyboardType="numeric"
            value={part.cost}
            onChangeText={(v) => updatePart(i, 'cost', v)}
          />
        </View>
      ))}

      <Pressable style={styles.addBtn} onPress={addPart}>
        <Text style={styles.addText}>+ Add Another Part</Text>
      </Pressable>

      {/* COST + STATUS */}
      <View>
        <TextInput
          style={styles.input}
          placeholder="Total Cost *"
          keyboardType="numeric"
          value={totalCost}
          onChangeText={setTotalCost}
        />

        <Text style={styles.label}>Status</Text>
        <Pressable
          style={styles.dropdownButton}
          onPress={() => setShowStatusDropdown(true)}
        >
          <Text style={styles.dropdownText}>
            {selectedStatus?.label || 'Pending'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </Pressable>

        {/* Status Dropdown Modal */}
        <Modal
          visible={showStatusDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStatusDropdown(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowStatusDropdown(false)}
          >
            <View style={styles.dropdownModal}>
              <Text style={styles.dropdownTitle}>Select Status</Text>
              {statuses.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.dropdownItem,
                    status === s.value && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setStatus(s.value as any);
                    setShowStatusDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      status === s.value && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>

      <Pressable style={styles.saveBtn} onPress={submit}>
        <Text style={styles.saveText}>Save Repair</Text>
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
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  section: {
    marginTop: 20,
    marginBottom: 6,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  partName: {
    flex: 0.6,
  },
  qty: {
    flex: 0.2,
  },
  cost: {
    flex: 0.2,
  },
  textarea: {
    height: 90,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
  },
  placeholder: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: '#2563eb',
  },
  addBtn: {
    backgroundColor: '#16a34a',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  addText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});