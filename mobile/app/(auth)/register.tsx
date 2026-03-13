import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AuthService } from '../../services/auth.service';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    nik: '',
    nama_lengkap: '',
    jenis_kelamin: '', // simplified for now, can use picker later
    tempat_lahir: '',
    tanggal_lahir: '',
    no_hp: '',
    kecamatan: 'Baleendah',
    desa: 'Rancamanyar',
    rt: '',
    rw: '',
    password: '',
    confirmPassword: '',
    role: 'kader'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.nik || !formData.password || !formData.nama_lengkap) {
      Alert.alert('Gagal', 'Harap isi NIK, Nama Lengkap, dan Password');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Gagal', 'Password dan Konfirmasi Password tidak cocok');
      return;
    }

    try {
      setIsLoading(true);
      await AuthService.register(formData);
      Alert.alert('Sukses', 'Registrasi berhasil. Silakan login.', [
        { text: 'OK', onPress: () => router.push('/(auth)/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Gagal Registrasi', error.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Registrasi Akun</Text>
          <Text style={styles.subtitle}>Isi data berikut untuk membuat akun Kader Posyandu</Text>
        </View>

        <View style={styles.formContainer}>
          <Input 
            label="NIK" 
            placeholder="Masukkan NIK" 
            value={formData.nik}
            onChangeText={(t) => updateForm('nik', t)}
            keyboardType="numeric"
          />
          <Input 
            label="Nama Lengkap" 
            placeholder="Masukkan nama lengkap" 
            value={formData.nama_lengkap}
            onChangeText={(t) => updateForm('nama_lengkap', t)}
          />
          
          {/* Note: In real app, make sure to use Picker component for Gender, Village, etc */}
          <Input 
            label="Nomor HP / WA" 
            placeholder="08xxxxxxxxx" 
            value={formData.no_hp}
            onChangeText={(t) => updateForm('no_hp', t)}
            keyboardType="phone-pad"
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Input 
                label="RT" 
                placeholder="001" 
                value={formData.rt}
                onChangeText={(t) => updateForm('rt', t)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.half}>
              <Input 
                label="RW" 
                placeholder="001" 
                value={formData.rw}
                onChangeText={(t) => updateForm('rw', t)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Input 
            label="Password" 
            placeholder="Buat password" 
            isPassword
            value={formData.password}
            onChangeText={(t) => updateForm('password', t)}
          />
          <Input 
            label="Konfirmasi Password" 
            placeholder="Ulangi password" 
            isPassword
            value={formData.confirmPassword}
            onChangeText={(t) => updateForm('confirmPassword', t)}
          />

          <Button 
            title="Daftar" 
            onPress={handleRegister} 
            loading={isLoading}
            style={styles.registerBtn}
          />

          <Button 
            title="Sudah punya akun? Login" 
            variant="ghost" 
            onPress={() => router.push('/(auth)/login')}
            style={styles.loginBtn}
          />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  half: {
    width: '48%',
  },
  registerBtn: {
    marginTop: 16,
  },
  loginBtn: {
    marginTop: 16,
  }
});
