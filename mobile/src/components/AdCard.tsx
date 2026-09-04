import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

export function AdCard({ ad }: any) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.imageWrap}>
        {ad.images?.[0] ? (
          <Image source={{ uri: ad.images[0] }} style={styles.image} />
        ) : (
          <Text style={styles.noImage}>📷</Text>
        )}
      </View>
      <View style={styles.info}>
        {ad.price != null && (
          <Text style={styles.price}>{ad.price.toLocaleString('ru-RU')} ₽</Text>
        )}
        <Text style={styles.title} numberOfLines={2}>{ad.title}</Text>
        <Text style={styles.city}>📍 {ad.city}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imageWrap: {
    aspectRatio: 4 / 3,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  noImage: { fontSize: 40 },
  info: { padding: 12 },
  price: { fontSize: 18, fontWeight: '800', color: '#16a34a' },
  title: { fontSize: 14, color: '#374151', marginTop: 4, flex: 1 },
  city: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
});
