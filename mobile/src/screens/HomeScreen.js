import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const features = [
    { title: 'Tasks & Errands', icon: 'clipboard-list', screen: 'Tasks' },
    { title: 'Elderly Assistance', icon: 'heart', screen: 'Elderly' },
    { title: 'Community Forum', icon: 'forum', screen: 'Forum' },
    { title: 'Donations & Swaps', icon: 'gift', screen: 'Donations' },
    { title: 'Mini-Jobs', icon: 'briefcase', screen: 'Jobs' },
    { title: 'Calendar & Events', icon: 'calendar', screen: 'Calendar' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Title>Welcome, {user?.name}! 👋</Title>
          <Paragraph>Connect with your neighbors and build a stronger community</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.statsCard}>
        <Card.Content>
          <Title>Your Stats</Title>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Title>{user?.time_credits || 0}</Title>
              <Paragraph>Time Credits</Paragraph>
            </View>
            <View style={styles.statItem}>
              <Title>{user?.reputation_score?.toFixed(1) || '0.0'} ⭐</Title>
              <Paragraph>Reputation</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.grid}>
        {features.map((feature, index) => (
          <Card
            key={index}
            style={styles.featureCard}
            onPress={() => navigation.navigate(feature.screen)}
          >
            <Card.Content>
              <Title style={styles.featureTitle}>{feature.title}</Title>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeCard: {
    margin: 10,
  },
  statsCard: {
    margin: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
  },
  featureCard: {
    width: '48%',
    margin: '1%',
    minHeight: 100,
  },
  featureTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
