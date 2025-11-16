import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, FAB } from 'react-native-paper';

export default function DonationsScreen() {
  return (
    <View style={styles.container}>
      <Card>
        <Card.Content>
          <Title>Donations & Swaps</Title>
          <Paragraph>
            Give away items, lend tools, share food with your community
          </Paragraph>
        </Card.Content>
      </Card>
      <FAB
        style={styles.fab}
        icon="plus"
        label="Donate Item"
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
