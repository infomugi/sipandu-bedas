import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AuthService } from '../../services/auth.service';

type Step = 'REQUEST' | 'WHATSAPP' | 'SUCCESS';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('REQUEST');
  const [nik, setNik] = useState('');
  const [noHp, setNoHp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // In a real flow, the simulation steps (link clicked, new password typed) will occur via deep linking.
  // For this module frontend simulation based on the HTML provided:

  const handleRequest = async () => {
    if (!nik || !noHp) {
      Alert.alert('Gagal', 'Semua kolom wajib diisi');
      return;
    }

    try {
      setIsLoading(true);
      await AuthService.forgotPassword({ nik, no_hp: noHp });
      // API successfully requested password reset, move to next simulation screen
      setStep('WHATSAPP');
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Permintaan gagal diproses');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRequestStep = () => (
    <View style={styles.card}>
      <Text style={styles.title}>Lupa Password</Text>
      <Text style={styles.subtitle}>
        Masukkan NIK dan Nomor WhatsApp yang terdaftar untuk menerima link reset password.
      </Text>

      <Input 
        label="NIK" 
        placeholder="Masukkan NIK" 
        value={nik}
        onChangeText={setNik}
        keyboardType="numeric"
      />

      <Input 
        label="Nomor WhatsApp" 
        placeholder="08xxxxxxxxxx" 
        value={noHp}
        onChangeText={setNoHp}
        keyboardType="phone-pad"
      />

      <Button 
        title="Kirim Permintaan" 
        onPress={handleRequest} 
        loading={isLoading}
        style={styles.btn}
      />

      <Button 
        title="Kembali ke Login" 
        variant="ghost" 
        onPress={() => router.push('/(auth)/login')}
        style={styles.backBtn}
        textStyle={{ color: '#64748b' }}
      />
    </View>
  );

  const renderWhatsappStep = () => (
    <View style={styles.cardCenter}>
      <View style={styles.iconCircle}>
        <Text style={{ fontSize: 32 }}>📱</Text>
      </View>
      <Text style={styles.titleCenter}>Link Terkirim</Text>
      <Text style={styles.subtitleCenter}>
        Link reset password telah dikirim ke nomor WhatsApp Anda.
      </Text>

      <View style={styles.mockupBox}>
        <Text style={styles.mockupTitle}>Simulasi Pesan WhatsApp:</Text>
        <Text style={styles.mockupText}>
          Halo Pengguna,\nSilakan klik link berikut untuk reset password Anda:\n
          <Text style={styles.mockupLink}>https://sipandubedas.id/reset/xyz123</Text>
        </Text>
      </View>

      <Button 
        title="Klik Link Reset (Simulasi Selesai)" 
        onPress={() => setStep('SUCCESS')} 
        style={styles.btn}
      />
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.cardCenter}>
      <View style={styles.iconCircleSuccess}>
        <Text style={{ fontSize: 32, color: '#059669' }}>✓</Text>
      </View>
      <Text style={styles.titleCenter}>Permintaan Selesai</Text>
      <Text style={styles.subtitleCenter}>
        Silakan periksa pesan Anda untuk melanjutkan pemulihan kata sandi melalui tautan (Simulasi berhasil).
      </Text>

      <Button 
        title="Masuk ke Akun" 
        onPress={() => router.push('/(auth)/login')} 
        style={styles.btn}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.background}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {step === 'REQUEST' && renderRequestStep()}
          {step === 'WHATSAPP' && renderWhatsappStep()}
          {step === 'SUCCESS' && renderSuccessStep()}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#059669',
    justifyContent: 'flex-end',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end', // push card to bottom like login screen
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  cardCenter: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    alignItems: 'center',
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
  titleCenter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleCenter: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 28,
    fontWeight: '500',
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    marginTop: 16,
  },
  backBtn: {
    marginTop: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconCircleSuccess: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ecfdf5',
    borderWidth: 4,
    borderColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mockupBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    width: '100%',
  },
  mockupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  mockupText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  mockupLink: {
    color: '#059669',
    textDecorationLine: 'underline',
    fontWeight: '600',
  }
});
