import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api/client';

export function CreateAdScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('electronics');
  const [images, setImages] = useState<string[]>([]);
  const [publishToAll, setPublishToAll] = useState(true);
  const [loading, setLoading] = useState(false);

  async function pickImages() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!res.canceled) {
      setImages(res.assets.map(a => a.uri));
    }
  }

  async function handlePublish() {
    if (!title || !description || !city) {
      Alert.alert('Ошибка', 'Заполните заголовок, описание и город');
      return;
    }
    setLoading(true);
    try {
      const token = 'user-token'; // заменить на реальный токен
      const ad = await api.createAd(
        { title, description, price: price ? Number(price) : undefined, city, category, images },
        token,
      );
      if (publishToAll) {
        const result = await api.publishAll(ad.id, token);
        console.log('Результат публикации:', result);
      }
      Alert.alert('🎉 Готово!', 'Объявление опубликовано на все площадки');
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📝 Новое объявление</Text>

        <TextInput
          style={styles.input}
          placeholder="Заголовок"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Описание"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Цена (₽)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Город"
            value={city}
            onChangeText={setCity}
          />
        </View>

        <TouchableOpacity style={styles.uploadBtn} onPress={pickImages}>
          <Text style={styles.uploadText}>📷 Загрузить фото ({images.length})</Text>
        </TouchableOpacity>

        <View style={styles.publishRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.publishTitle}>🚀 На все площадки</Text>
            <Text style={styles.publishSub}>Авито, Юла, OLX, Мешок</Text>
          </View>
          <Switch value={publishToAll} onValueChange={setPublishToAll} trackColor={{ true: '#16a34a' }} />
        </View>

        <TouchableOpacity
          style={[styles.submit, loading && styles.submitDisabled]}
          onPress={handlePublish}
          disabled={loading}
        >
          <Text style={styles.submitText}>{loading ? '⏳ Публикуем...' : '🚀 Опубликовать'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  uploadBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  uploadText: { fontSize: 15, fontWeight: '600', color: '#16a34a' },
  publishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  publishTitle: { fontSize: 16, fontWeight: '700', color: '#166534' },
  publishSub: { fontSize: 13, color: '#15803d', marginTop: 2 },
  submit: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
