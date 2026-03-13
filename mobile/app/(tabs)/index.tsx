import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard Placeholder</Text>
      <Text style={styles.subtitle}>Selamat datang, {user?.nama_lengkap}</Text>
      
      <Button 
        title="Logout" 
        onPress={logout}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  }
});
