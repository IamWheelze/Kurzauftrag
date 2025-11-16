import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';

export default function ElderlyScreen() {
  return (
    <View style={styles.container}>
      <Card>
        <Card.Content>
          <Title>Elderly Assistance Hub</Title>
          <Paragraph>
            Schedule-based help, family monitoring, and alerts for elderly community members
          </Paragraph>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
});
