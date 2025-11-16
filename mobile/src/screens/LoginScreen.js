import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Title, Paragraph, Surface } from 'react-native-paper';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../contexts/AuthContext';

const GOOGLE_CLIENT_ID = 'your_google_client_id';
const API_URL = 'http://localhost:5000';

export default function LoginScreen() {
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
      });

      const result = await AuthSession.startAsync({
        authUrl: `${API_URL}/api/auth/google`,
      });

      if (result.type === 'success' && result.params.token) {
        await login(result.params.token);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface}>
        <Title style={styles.title}>Welcome to Community Services</Title>
        <Paragraph style={styles.subtitle}>
          Connect with neighbors for errands, elderly care, events, and more
        </Paragraph>

        <Button
          mode="contained"
          icon="google"
          onPress={handleGoogleLogin}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Sign in with Google
        </Button>

        <View style={styles.features}>
          <Paragraph style={styles.featureTitle}>Features:</Paragraph>
          <Paragraph>📅 Calendar Integration</Paragraph>
          <Paragraph>🔔 Smart Notifications</Paragraph>
          <Paragraph>⭐ Time Credits System</Paragraph>
          <Paragraph>🌍 Newcomer Support</Paragraph>
          <Paragraph>🛡️ Trust & Safety</Paragraph>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    padding: 20,
    borderRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  button: {
    marginVertical: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  features: {
    marginTop: 20,
  },
  featureTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
