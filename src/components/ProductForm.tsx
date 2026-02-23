import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { api } from "@/src/services/api";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useScanStore } from "@/src/stores/scan.store";

interface Store {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  parent_id?: number;
}

interface Brand {
  id: number;
  name: string;
}

interface Specification {
  key: string;
  value: string;
}

interface GalleryImage {
  uri: string;
  name: string;
  type: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: any;
  loading?: boolean;
  onSubmit: (formData: FormData) => Promise<void>;
  paddingTop?: number;
  style?: any;
}

export default function ProductForm({
  mode,
  initialData,
  loading = false,
  onSubmit,
  paddingTop = 0,
}: ProductFormProps) {
  const router = useRouter();
  
  // ---------------- FORM STATE ----------------
  const [storeId, setStoreId] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");

  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{barcode?: string}>();
  const scannedBarcode = useScanStore((s) => s.barcode);
  const clearScannedBarcode = useScanStore((s) => s.clear);

  const [mainImage, setMainImage] = useState<GalleryImage | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);

  // Used device
  const [isUsed, setIsUsed] = useState(false);
  const [conditionGrade, setConditionGrade] = useState("");
  const [batteryHealth, setBatteryHealth] = useState("");
  const [imei, setImei] = useState("");
  const [warrantyDays, setWarrantyDays] = useState("");
  const [boxAvailable, setBoxAvailable] = useState(false);
  const [chargerAvailable, setChargerAvailable] = useState(false);
  const [headphonesAvailable, setHeadphonesAvailable] = useState(false);

  // Dropdowns
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // ---------------- INIT ----------------
  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (params.barcode) {
        setBarcode(String(params.barcode));
      }
    }, [params.barcode]),
  );

  useEffect(() => {
    if (!scannedBarcode) return;
    setBarcode(String(scannedBarcode));
    clearScannedBarcode();
  }, [scannedBarcode, clearScannedBarcode]);

  useEffect(() => {
    if (!initialData) return;

    const baseUrl = api.defaults.baseURL?.replace('/api', '') || '';
    const toAbsoluteUrl = (path: string) =>
      path.startsWith("http") ? path : `${baseUrl}/storage/${path}`;

    setStoreId(String(initialData.store_id ?? ""));
    setParentCategoryId(String(initialData.parent_category_id ?? ""));
    setCategoryId(String(initialData.category_id ?? ""));
    setBrandId(String(initialData.brand_id ?? ""));
    setName(initialData.name ?? "");
    setDescription(initialData.description ?? "");
    setPrice(String(initialData.price ?? ""));
    setCostPrice(String(initialData.cost_price ?? ""));
    setStock(String(initialData.stock ?? ""));
    setSku(initialData.sku ?? "");
    setBarcode(initialData.barcode ?? "");

    if(initialData.image){
      setMainImage({
        uri: toAbsoluteUrl(initialData.image),
        name: "image",
        type: "image/jpeg",
      });
    }
    if (initialData.gallery && Array.isArray(initialData.gallery)) {
    setGalleryImages(
      initialData.gallery.map((url: string, i: number) => ({
        uri: toAbsoluteUrl(url),
        name: `existing-gallery-${i}.jpg`,
        type: "image/jpeg",
      })),
    );
  }

    const usedFlag = initialData.is_used == 1 || initialData.is_used === true;
    setIsUsed(usedFlag);

    const usedDetails =
      initialData.used_device_details ??
      initialData.usedDeviceDetails ??
      initialData.used_device_detail ??
      initialData.usedDeviceDetail;

    setConditionGrade(
      usedDetails?.device_condition ?? initialData.condition_grade ?? "",
    );
    setBatteryHealth(
      String(usedDetails?.battery_health ?? initialData.battery_health ?? ""),
    );
    setImei(usedDetails?.imei ?? initialData.imei ?? "");
    setWarrantyDays(
      String(usedDetails?.warranty_days ?? initialData.warranty_days ?? ""),
    );

    setBoxAvailable(
      usedDetails?.box_available ??
        (initialData.box_available == 1 || initialData.box_available === true),
    );
    setChargerAvailable(
      usedDetails?.charger_available ??
        (initialData.charger_available == 1 ||
          initialData.charger_available === true),
    );
    setHeadphonesAvailable(
      usedDetails?.headphones_available ??
        (initialData.headphones_available == 1 ||
          initialData.headphones_available === true),
    );

    if (initialData.specifications) {
      setSpecifications(initialData.specifications);
    }
  }, [initialData]);

  useEffect(() => {
    if (parentCategoryId) {
      setSubcategories(
        categories.filter((c) => c.parent_id === Number(parentCategoryId)),
      );
    } else {
      setSubcategories([]);
    }
  }, [parentCategoryId, categories]);

  // ---------------- DATA ----------------
  const fetchData = async () => {
    try {
      const [storesRes, categoriesRes, brandsRes] = await Promise.all([
        api.get("/stores"),
        api.get("/categories"),
        api.get("/brands"),
      ]);

      setStores(storesRes.data.data || storesRes.data);
      setCategories(categoriesRes.data.data || categoriesRes.data);
      setBrands(brandsRes.data.data || brandsRes.data);
    } catch {
      Alert.alert("Error", "Failed to load form data");
    } finally {
      setDataLoading(false);
    }
  };

  // ---------------- IMAGE PICKERS ----------------
  const pickMainImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!res.canceled) {
      const a = res.assets[0];
      setMainImage({
        uri: a.uri,
        name: a.fileName ?? `main-${Date.now()}.jpg`,
        type: "image/jpeg",
      });
    }
  };

  const pickGalleryImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!res.canceled) {
      setGalleryImages((prev) => [
        ...prev,
        ...res.assets.map((a, i) => ({
          uri: a.uri,
          name: a.fileName ?? `gallery-${Date.now()}-${i}.jpg`,
          type: "image/jpeg",
        })),
      ]);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ---------------- SPECIFICATIONS ----------------
  const addSpecification = () => {
    setSpecifications((prev) => [...prev, { key: "", value: "" }]);
  };

  const updateSpecification = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setSpecifications((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const removeSpecification = (index: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  // ---------------- SUBMIT ----------------
  const submit = async () => {
    if (!storeId || !name || !price || !stock) {
      Alert.alert("Error", "Please fill required fields");
      return;
    }

    const fd = new FormData();

    fd.append("store_id", storeId);
    fd.append("name", name);
    fd.append("description", description);
    fd.append("price", price);
    if (costPrice) fd.append("cost_price", costPrice);
    fd.append("stock", stock);
    fd.append("is_used", isUsed ? "1" : "0");

    if (sku) fd.append("sku", sku);
    if (barcode) fd.append("barcode", barcode);
    if (parentCategoryId) fd.append("parent_category_id", parentCategoryId);
    if (categoryId) fd.append("category_id", categoryId);
    if (brandId) fd.append("brand_id", brandId);

    if (mainImage) {
      fd.append("image", mainImage as any);
    }

    galleryImages.forEach((img) => {
      fd.append("gallery[]", img as any);
    });

    specifications.forEach((s, i) => {
      if (s.key && s.value) {
        fd.append(`specifications[${i}][key]`, s.key);
        fd.append(`specifications[${i}][value]`, s.value);
      }
    });

    await onSubmit(fd);
  };

  // ---------------- RENDER ----------------
  if (dataLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.top + 20}
    >
      <ScrollView
        style={[styles.scrollContent, { paddingTop: insets.top + 4 }]}
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.title}>
        {mode === "create" ? "Add Product" : "Edit Product"}
      </Text>

      {/* STORE */}
      <View style={styles.field}>
        <Text style={styles.label}>Store *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={storeId}
            onValueChange={setStoreId}
            style={styles.picker}
          >
            <Picker.Item label="Select Store" value="" />
            {stores.map((store) => (
              <Picker.Item
                key={store.id}
                label={store.name}
                value={String(store.id)}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* USED DEVICE TOGGLE */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>Used Device</Text>
        <Switch value={isUsed} onValueChange={setIsUsed} />
      </View>

      {isUsed && (
        <View style={styles.usedCard}>
          <Text style={styles.usedTitle}>Used Device Details</Text>

          {/* Condition */}
          <View style={styles.field}>
            <Text style={styles.label}>Condition</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={conditionGrade}
                onValueChange={setConditionGrade}
              >
                <Picker.Item label="Select condition" value="" />
                <Picker.Item label="New" value="new" />
                <Picker.Item label="Used" value="used" />
                <Picker.Item label="Refurbished" value="refurbished" />
              </Picker>
            </View>
          </View>

          {/* Battery Health */}
          <TextInput
            style={styles.input}
            placeholder="Battery Health (%)"
            keyboardType="number-pad"
            value={batteryHealth}
            onChangeText={setBatteryHealth}
          />

          {/* IMEI */}
          <TextInput
            style={styles.input}
            placeholder="IMEI"
            value={imei}
            onChangeText={setImei}
          />

          {/* Warranty */}
          <TextInput
            style={styles.input}
            placeholder="Warranty (days)"
            keyboardType="number-pad"
            value={warrantyDays}
            onChangeText={setWarrantyDays}
          />

          {/* Accessories */}
          <Text style={styles.subTitle}>Included Accessories</Text>

          <View style={styles.accessoryRow}>
            <Text style={styles.accessoryLabel}>Box</Text>
            <Switch value={boxAvailable} onValueChange={setBoxAvailable} />
          </View>

          <View style={styles.accessoryRow}>
            <Text style={styles.accessoryLabel}>Charger</Text>
            <Switch
              value={chargerAvailable}
              onValueChange={setChargerAvailable}
            />
          </View>

          <View style={styles.accessoryRow}>
            <Text style={styles.accessoryLabel}>Headphones</Text>
            <Switch
              value={headphonesAvailable}
              onValueChange={setHeadphonesAvailable}
            />
          </View>
        </View>
      )}

      {/* MAIN CATEGORY */}
      <View style={styles.field}>
        <Text style={styles.label}>Main Category *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={parentCategoryId}
            onValueChange={setParentCategoryId}
            style={styles.picker}
          >
            <Picker.Item label="Select Main Category" value="" />
            {categories
              .filter((cat) => !cat.parent_id)
              .map((cat) => (
                <Picker.Item
                  key={cat.id}
                  label={cat.name}
                  value={String(cat.id)}
                />
              ))}
          </Picker>
        </View>
      </View>

      {/* SUBCATEGORY */}
      <View style={styles.field}>
        <Text style={styles.label}>Subcategory</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={categoryId}
            onValueChange={setCategoryId}
            style={styles.picker}
            enabled={subcategories.length > 0}
          >
            <Picker.Item label="Select Subcategory" value="" />
            {subcategories.map((sub) => (
              <Picker.Item
                key={sub.id}
                label={sub.name}
                value={String(sub.id)}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* BRAND */}
      <View style={styles.field}>
        <Text style={styles.label}>Brand</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={brandId}
            onValueChange={setBrandId}
            style={styles.picker}
          >
            <Picker.Item label="Select Brand" value="" />
            {brands.map((brand) => (
              <Picker.Item
                key={brand.id}
                label={brand.name}
                value={String(brand.id)}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* PRODUCT NAME */}
      <TextInput
        style={styles.input}
        placeholder="Product Name *"
        value={name}
        onChangeText={setName}
      />

      {/* DESCRIPTION */}
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      {/* PRICE & STOCK */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Price (KD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />
        </View>

        <View style={styles.halfField}>
          <Text style={styles.label}>Cost Price (KD)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={costPrice}
            onChangeText={setCostPrice}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Stock *</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="number-pad"
            value={stock}
            onChangeText={setStock}
          />
        </View>
      </View>

      {/* SKU */}
      <View style={styles.field}>
        <Text style={styles.label}>SKU</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., LSQ-WATCH-001"
          value={sku}
          onChangeText={setSku}
          autoCapitalize="characters"
        />
      </View>

      {/* BARCODE */}
      <View style={styles.field}>
        <Text style={styles.label}>Barcode</Text>
        <View style={styles.barcodeRow}>
          <TextInput
            style={styles.barcodeInput}
            placeholder="Enter or scan"
            value={barcode}
            onChangeText={setBarcode}
            autoCapitalize="characters"
          />
          <Pressable
            style={styles.scanBtn}
            onPress={() =>
              router.push({
                pathname: "/modal",
                params: { returnTo: "back" },
              })
            }
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="barcode-outline" size={18} color="#fff" />
              <Text style={styles.scanText}>Scan</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* MAIN IMAGE */}
      <View style={styles.field}>
        <Text style={styles.label}>Main Image</Text>
        {mainImage && (
          <Image
            source={{ uri: mainImage.uri }}
            style={styles.mainImagePreview}
          />
        )}
        <Pressable style={styles.imageBtn} onPress={pickMainImage}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="image-outline" size={18} color="#374151" />
            <Text style={styles.imageBtnText}>
              {mainImage ? "Change Image" : "Pick Image"}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* GALLERY */}
      <View style={styles.field}>
        <Text style={styles.label}>Gallery Images</Text>
        <Pressable style={styles.imageBtn} onPress={pickGalleryImages}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="image-outline" size={18} color="#374151" />
            <Text style={styles.imageBtnText}>Add Gallery Images</Text>
          </View>
        </Pressable>

        {galleryImages.length > 0 && (
          <View style={styles.galleryGrid}>
            {galleryImages.map((img, index) => (
              <View key={index} style={styles.galleryItem}>
                <Image source={{ uri: img.uri }} style={styles.galleryImage} />
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removeGalleryImage(index)}
                >
                  <Text style={styles.removeBtnText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* SPECIFICATIONS */}
      <View style={styles.field}>
        <Text style={styles.sectionTitle}>Specifications</Text>
        {specifications.map((spec, index) => (
          <View key={index} style={styles.specRow}>
            <TextInput
              style={styles.specInput}
              placeholder="Spec name"
              value={spec.key}
              onChangeText={(val) => updateSpecification(index, "key", val)}
            />
            <TextInput
              style={styles.specInput}
              placeholder="Spec value"
              value={spec.value}
              onChangeText={(val) => updateSpecification(index, "value", val)}
            />
            <Pressable
              style={styles.removeSpecBtn}
              onPress={() => removeSpecification(index)}
            >
              <Text style={styles.removeBtnText}>×</Text>
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.addSpecBtn} onPress={addSpecification}>
          <Text style={styles.addSpecText}>+ Add Specification</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.submitBtn, loading && styles.disabled]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {mode === "create" ? "Save Product" : "Update Product"}
          </Text>
        )}
      </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 16,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111",
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  barcodeRow: {
    flexDirection: "row",
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  scanBtn: {
    backgroundColor: "#111",
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  scanText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  imageBtn: {
    backgroundColor: "#f3f4f6",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
  },
  imageBtnText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 15,
  },
  mainImagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: "cover",
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  galleryItem: {
    width: "48%",
    aspectRatio: 1,
    position: "relative",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ef4444",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111",
  },
  specRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  specInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  removeSpecBtn: {
    backgroundColor: "#ef4444",
    width: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addSpecBtn: {
    backgroundColor: "#e5e7eb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  addSpecText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  usedCard: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  usedTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111",
  },

  subTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
    color: "#374151",
  },

  accessoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },

  accessoryLabel: {
    fontSize: 14,
    color: "#374151",
  },
});
