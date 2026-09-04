import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { api } from '../api/client';
import { AdCard } from '../components/AdCard';

const CATEGORIES = [
  { id: 'electronics', icon: '📱', name: 'Электроника' },
  { id: 'auto', icon: '🚗', name: 'Авто' },
  { id: 'realestate', icon: '🏠', name: 'Недвижимость' },
  { id: 'clothes', icon: '👕', name: 'Одежда' },
  { id: 'home', icon: '🛋️', name: 'Дом' },
  { id: 'jobs', icon: '💼', name: 'Работа' },
  { id: 'services', icon: '🔧', name: 'Услуги' },
  { id: 'other', icon: '📦', name: 'Другое' },
];

export function HomeScreen() {
  const [ads, setAds] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAds();
  }, [category]);

  async function loadAds() {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (category) params.category = category;
    const data = await api.getAds(params);
    setAds(data.items || []);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🛒 МегаМаркет</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Найти что угодно..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={loadAds}
        />
      </View>

      <View style={styles.categories}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.category, category === item.id && styles.categoryActive]}
              onPress={() => setCategory(category === item.id ? '' : item.id)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={[styles.categoryName, category === item.id && styles.categoryNameActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={ads}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <AdCard ad={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadAds(); setRefreshing(false); }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Пока нет объявлений</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  logo: { fontSize: 22, fontWeight: '800', color: '#16a34a' },
  searchWrap: { paddingHorizontal: 16 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categories: { paddingVertical: 12, paddingLeft: 16 },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  categoryNameActive: { color: '#fff' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 50, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
