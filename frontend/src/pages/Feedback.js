import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useMutation } from 'react-query';
import { feedbackAPI } from '../services/api';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

function Feedback() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general',
    email: '',
    name: '',
  });

  const submitMutation = useMutation(feedbackAPI.submit, {
    onSuccess: () => {
      enqueueSnackbar('Thank you for your feedback! You earned 2 time credits.', {
        variant: 'success',
      });
      setFormData({
        subject: '',
        message: '',
        category: 'general',
        email: '',
        name: '',
      });
    },
    onError: () => {
      enqueueSnackbar('Failed to submit feedback', { variant: 'error' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Send Feedback or Request Adjustments
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Have suggestions or need adjustments to the platform? We'd love to hear from you!
          {user && ' You'll earn 2 time credits for providing feedback.'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {!user && (
            <>
              <TextField
                fullWidth
                label="Your Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Your Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
                required
              />
            </>
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <MenuItem value="general">General Feedback</MenuItem>
              <MenuItem value="bug">Bug Report</MenuItem>
              <MenuItem value="feature">Feature Request</MenuItem>
              <MenuItem value="adjustment">Platform Adjustment</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            margin="normal"
            multiline
            rows={6}
            required
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<Send />}
            fullWidth
            sx={{ mt: 2 }}
            disabled={submitMutation.isLoading}
          >
            {submitMutation.isLoading ? 'Sending...' : 'Submit Feedback'}
          </Button>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            📧 Alternative Contact Methods:
          </Typography>
          <Typography variant="body2">
            Email: support@communityservices.com
          </Typography>
          <Typography variant="body2">
            Response time: Usually within 24-48 hours
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default Feedback;
