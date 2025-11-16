import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, List } from 'react-native-paper';
import { useQuery } from 'react-query';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export default function CalendarScreen() {
  const { data: holidays } = useQuery('upcomingHolidays', async () => {
    const response = await axios.get(`${API_URL}/api/calendar/holidays/upcoming`, {
      params: { days: 90 }
    });
    return response.data.holidays;
  });

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>🌍 Upcoming Holidays & Cultural Events</Title>
          <Paragraph style={styles.subtitle}>
            Important dates and their cultural significance
          </Paragraph>

          {holidays?.slice(0, 5).map((holiday) => (
            <List.Item
              key={holiday.id}
              title={`${holiday.name} - ${new Date(holiday.date).toLocaleDateString()}`}
              description={
                <>
                  {holiday.description}{'\n'}
                  {holiday.cultural_context && (
                    <Paragraph style={styles.cultural}>
                      {holiday.cultural_context}
                    </Paragraph>
                  )}
                </>
              }
              left={(props) => <List.Icon {...props} icon="calendar" />}
            />
          ))}
        </Card.Content>
      </Card>

      <Button mode="contained" style={styles.syncButton} icon="sync">
        Sync Google Calendar
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
  subtitle: {
    color: '#666',
    marginBottom: 10,
  },
  cultural: {
    fontStyle: 'italic',
    marginTop: 5,
  },
  syncButton: {
    margin: 10,
  },
});
