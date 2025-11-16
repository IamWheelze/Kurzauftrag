import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Title, Paragraph, Card } from 'react-native-paper';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export default function FeedbackScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/feedback`, {
        subject,
        message,
        category: 'general'
      });
      alert('Thank you for your feedback! You earned 2 time credits.');
      setSubject('');
      setMessage('');
    } catch (error) {
      alert('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Send Feedback</Title>
          <Paragraph style={styles.subtitle}>
            Have suggestions or need adjustments? We'd love to hear from you!
          </Paragraph>

          <TextInput
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Message"
            value={message}
            onChangeText={setMessage}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={!subject || !message || loading}
            style={styles.button}
          >
            Submit Feedback
          </Button>

          <Card style={styles.contactCard}>
            <Card.Content>
              <Paragraph style={styles.contactTitle}>
                📧 Alternative Contact:
              </Paragraph>
              <Paragraph>support@communityservices.com</Paragraph>
            </Card.Content>
          </Card>
        </Card.Content>
      </Card>
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
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  contactCard: {
    marginTop: 20,
    backgroundColor: '#f0f0f0',
  },
  contactTitle: {
    fontWeight: 'bold',
  },
});
