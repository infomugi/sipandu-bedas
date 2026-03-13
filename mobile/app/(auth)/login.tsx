import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth.store';
import { AuthService } from '../../services/auth.service';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!nik || !password) {
      Alert.alert('Gagal', 'NIK dan password harus diisi');
      return;
    }

    try {
      setIsLoading(true);
      const res: any = await AuthService.login({ nik, password });
      
      if (res.token && res.user) {
        await setAuth(res.token, res.user);
        // Root layout will redirect automatically based on auth state
      } else {
        Alert.alert('Gagal', 'Respons tidak valid dari server');
      }
    } catch (error: any) {
      Alert.alert('Login Gagal', error.message || 'Periksa NIK dan Password Anda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Background Gradient */}
      <View style={styles.background}>
        <View style={styles.hero}>
          <Text style={styles.sparkle1}>✦</Text>
          <Text style={styles.sparkle2}>★</Text>
          
          <Image 
            source={require('../../assets/images/react-logo.png')} // Ganti dengan logo sipandu bedas
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Masuk</Text>
          <Text style={styles.subtitle}>
            Dengan masuk, Anda menyetujui Syarat Ketentuan kami.
          </Text>

          <Input 
            label="NIK / Username" 
            placeholder="Masukkan NIK atau username"
            value={nik}
            onChangeText={setNik}
            keyboardType="numeric"
          />

          <Input 
            label="Password" 
            placeholder="Masukkan password"
            isPassword
            value={password}
            onChangeText={setPassword}
          />

          <Button 
            title="Masuk" 
            onPress={handleLogin} 
            loading={isLoading}
            style={styles.loginBtn}
          />

          <Button 
            title="Lupa Password?" 
            variant="ghost" 
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotBtn}
            textStyle={{ color: '#059669', fontSize: 14 }}
          />

          <Text style={styles.footerText}>
            Belum punya akun? <Text style={styles.link} onPress={() => router.push('/(auth)/register')}>Daftar</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#059669',
  },
  background: {
    flex: 1,
    minHeight: height,
    backgroundColor: '#059669', // Menggunakan warna solid sebagai fallback gradient
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logo: {
    width: 150,
    height: 150,
  },
  sparkle1: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 24,
    top: '20%',
    left: '20%',
  },
  sparkle2: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    bottom: '30%',
    right: '25%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 28,
    fontWeight: '500',
  },
  loginBtn: {
    marginTop: 8,
  },
  forgotBtn: {
    marginTop: 16,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  link: {
    color: '#0f172a',
    fontWeight: '700',
  }
});
