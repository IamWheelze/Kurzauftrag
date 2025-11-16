import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip, FAB } from 'react-native-paper';

export default function ForumScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Community Forum</Title>
          <Paragraph>Local updates, lost pets, garage sales, and meetups</Paragraph>
        </Card.Content>
      </Card>
      <FAB
        style={styles.fab}
        icon="plus"
        label="New Post"
        onPress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
