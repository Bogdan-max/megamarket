import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>👤 Профиль</Text>
      <View style={styles.placeholder}>
        <Text style={styles.icon}>📊</Text>
        <Text style={styles.text}>Здесь будут ваши объявления</Text>
        <Text style={styles.sub}>Статистика площадок и настройки</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', padding: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16 },
  placeholder: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  icon: { fontSize: 48, marginBottom: 12 },
  text: { fontSize: 16, fontWeight: '600', color: '#374151' },
  sub: { fontSize: 14, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
});
