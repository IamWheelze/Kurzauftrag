import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Avatar, Button, Chip } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Avatar.Image
              size={80}
              source={{ uri: user.profile_picture }}
            />
            <View style={styles.headerInfo}>
              <Title>{user.name}</Title>
              <Paragraph>{user.email}</Paragraph>
              {user.is_verified && (
                <Chip style={styles.chip} mode="flat">Verified</Chip>
              )}
            </View>
          </View>

          {user.bio && (
            <Paragraph style={styles.bio}>{user.bio}</Paragraph>
          )}

          <View style={styles.info}>
            <Paragraph>📍 {user.city || 'Location not set'}</Paragraph>
            <Paragraph>
              📅 Member since {new Date(user.created_at).toLocaleDateString()}
            </Paragraph>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title>{user.time_credits || 0}</Title>
            <Paragraph>Time Credits</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Title>{user.reputation_score?.toFixed(1) || '0.0'} ⭐</Title>
            <Paragraph>Reputation</Paragraph>
            <Paragraph style={styles.caption}>
              {user.total_ratings || 0} ratings
            </Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Button
        mode="outlined"
        onPress={logout}
        style={styles.logoutButton}
        icon="logout"
      >
        Logout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerInfo: {
    marginLeft: 15,
    flex: 1,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  bio: {
    marginVertical: 10,
  },
  info: {
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
  },
  caption: {
    fontSize: 12,
    color: '#666',
  },
  logoutButton: {
    margin: 10,
  },
});
