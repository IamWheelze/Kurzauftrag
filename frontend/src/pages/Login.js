import React from 'react';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { Google } from '@mui/icons-material';

function Login() {
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Welcome to Community Services
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Connect with neighbors for errands, elderly care, events, and more
          </Typography>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<Google />}
            onClick={handleGoogleLogin}
            sx={{ py: 1.5 }}
          >
            Sign in with Google
          </Button>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Features:
            </Typography>
            <ul>
              <li>📅 Calendar Integration - Sync with Google Calendar</li>
              <li>🔔 Smart Notifications - Stay updated on community events</li>
              <li>⭐ Time Credits - Earn and give for helping neighbors</li>
              <li>🌍 Newcomer Support - Learn about local holidays and customs</li>
              <li>🛡️ Trust & Safety - Verified users and reputation system</li>
            </ul>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
