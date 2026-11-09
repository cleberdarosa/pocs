import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppLogo } from '@/components/AppLogo';
import { Snackbar } from '@/components/Snackbar';
import { Colors } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';
import { useAuthStore } from '@/stores/authStore';

// Pré-preenchimento só em desenvolvimento, lido de `.env.local` (fora do git).
const DEV_CPF = __DEV__ ? (process.env.EXPO_PUBLIC_DEV_CPF ?? '') : '';
const DEV_SENHA = __DEV__ ? (process.env.EXPO_PUBLIC_DEV_SENHA ?? '') : '';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [cpf, setCpf] = useState(DEV_CPF);
  const [senha, setSenha] = useState(DEV_SENHA);
  const [focused, setFocused] = useState<'cpf' | 'senha' | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const hideSnackbar = useCallback(() => setSnackbar(null), []);

  const handleLogin = async () => {
    const success = await login(cpf.trim(), senha);

    if (success) {
      router.replace('/home');
    } else {
      setSnackbar('Não foi possível realizar o login.');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <AppLogo />
          </View>

          <Text style={styles.title}>Bem-vindo</Text>
          <Text style={styles.subtitle}>Acesse sua conta Unimed Porto Alegre</Text>

          <Text style={styles.label}>CPF</Text>
          <TextInput
            value={cpf}
            onChangeText={setCpf}
            keyboardType="number-pad"
            autoComplete="username"
            placeholder="CPF"
            accessibilityLabel="CPF"
            onFocus={() => setFocused('cpf')}
            onBlur={() => setFocused(null)}
            style={[styles.input, focused === 'cpf' && styles.inputFocused]}
          />

          <Text style={[styles.label, styles.labelSpacing]}>Senha</Text>
          <TextInput
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoComplete="password"
            placeholder="Senha"
            accessibilityLabel="Senha"
            onFocus={() => setFocused('senha')}
            onBlur={() => setFocused(null)}
            onSubmitEditing={handleLogin}
            style={[styles.input, focused === 'senha' && styles.inputFocused]}
          />

          <View style={styles.forgot}>
            <AppButton variant="text" title="Esqueci minha senha" onPress={() => {}} />
          </View>

          <AppButton
            title="Entrar"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.submit}
          />

          <View style={styles.firstAccess}>
            <Text style={styles.body}>É o seu primeiro acesso? </Text>
            <Pressable accessibilityRole="link" onPress={() => {}}>
              <Text style={styles.link}>Clique aqui</Text>
            </Pressable>
          </View>

          <Text style={[styles.body, styles.center, styles.privacy]}>
            Para autenticar na Unimed Porto Alegre, você precisa confirmar e compreender nossa
            Política de Privacidade.
          </Text>

          <Text style={[styles.body, styles.center]}>Versão {APP_VERSION}</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar message={snackbar} onHide={hideSnackbar} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: DS.spaceLg,
    paddingTop: 40,
  },
  logo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: DS.spaceSm,
    marginBottom: 40,
    color: Colors.secondary,
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: DS.spaceXs,
  },
  labelSpacing: {
    marginTop: DS.spaceMd,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    borderRadius: 4,
    paddingHorizontal: DS.spaceMd,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: 'transparent',
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  forgot: {
    alignItems: 'flex-end',
    marginTop: DS.spaceXs,
  },
  submit: {
    height: DS.buttonHeight,
    marginTop: DS.spaceMd,
  },
  firstAccess: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: DS.spaceLg,
  },
  body: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  link: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
  center: {
    textAlign: 'center',
  },
  privacy: {
    marginVertical: DS.spaceLg,
    marginBottom: 40,
  },
});
