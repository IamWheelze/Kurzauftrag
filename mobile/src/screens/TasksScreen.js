import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, FAB } from 'react-native-paper';
import { useQuery } from 'react-query';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export default function TasksScreen() {
  const { data: tasks, isLoading } = useQuery('tasks', async () => {
    const response = await axios.get(`${API_URL}/api/tasks`, {
      params: { status: 'open' }
    });
    return response.data.tasks;
  });

  const renderTask = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.title}</Title>
        <Paragraph>{item.description}</Paragraph>
        <View style={styles.chipContainer}>
          <Chip>{item.category}</Chip>
          <Chip mode="outlined">{item.credits_offered} credits</Chip>
        </View>
        {item.location && (
          <Paragraph style={styles.location}>📍 {item.location}</Paragraph>
        )}
        <Paragraph style={styles.author}>By: {item.creator_name}</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button mode="contained">Accept Task</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      <FAB
        style={styles.fab}
        icon="plus"
        label="Post Task"
        onPress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 5,
    marginVertical: 10,
  },
  location: {
    marginTop: 5,
  },
  author: {
    fontSize: 12,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
