import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, FAB } from 'react-native-paper';

export default function JobsScreen() {
  return (
    <View style={styles.container}>
      <Card>
        <Card.Content>
          <Title>Mini-Jobs & Youth Tasks</Title>
          <Paragraph>Earn credits or money helping neighbors</Paragraph>
        </Card.Content>
      </Card>
      <FAB
        style={styles.fab}
        icon="plus"
        label="Post Job"
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
