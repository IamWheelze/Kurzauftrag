import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Alert,
} from '@mui/material';
import {
  Assignment,
  Elderly,
  Forum,
  CardGiftcard,
  Work,
  Business,
  Event,
  Stars,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { calendarAPI } from '../services/api';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: upcomingHolidays } = useQuery(
    'upcomingHolidays',
    () => calendarAPI.getUpcomingHolidays({ days: 30 }).then((res) => res.data.holidays),
    { enabled: !!user }
  );

  const features = [
    {
      title: 'Tasks & Errands',
      description: 'Get help with cleaning, dog walking, groceries, and more',
      icon: <Assignment fontSize="large" />,
      path: '/tasks',
    },
    {
      title: 'Elderly Assistance',
      description: 'Schedule-based help, family monitoring, and alerts',
      icon: <Elderly fontSize="large" />,
      path: '/elderly',
    },
    {
      title: 'Community Forum',
      description: 'Local updates, lost pets, garage sales, and meetups',
      icon: <Forum fontSize="large" />,
      path: '/forum',
    },
    {
      title: 'Donations & Swaps',
      description: 'Give away items, lend tools, share food',
      icon: <CardGiftcard fontSize="large" />,
      path: '/donations',
    },
    {
      title: 'Mini-Jobs',
      description: 'Earn credits or money helping neighbors',
      icon: <Work fontSize="large" />,
      path: '/jobs',
    },
    {
      title: 'Local Businesses',
      description: 'Find local service providers',
      icon: <Business fontSize="large" />,
      path: '/businesses',
    },
    {
      title: 'Calendar & Events',
      description: 'Sync your calendar, view holidays and events',
      icon: <Event fontSize="large" />,
      path: '/calendar',
    },
    {
      title: 'Time Credits',
      description: 'Earn and give credits for community participation',
      icon: <Stars fontSize="large" />,
      path: '/credits',
    },
  ];

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome {user ? user.name : 'to Community Services'}! 👋
      </Typography>
      <Typography variant="h6" color="text.secondary" paragraph>
        Connect with your neighbors and build a stronger community
      </Typography>

      {upcomingHolidays && upcomingHolidays.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            🌍 Upcoming Holiday: {upcomingHolidays[0].name}
          </Typography>
          <Typography variant="body2">
            {new Date(upcomingHolidays[0].date).toLocaleDateString()} - {upcomingHolidays[0].description}
          </Typography>
          {upcomingHolidays[0].cultural_context && (
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              {upcomingHolidays[0].cultural_context}
            </Typography>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={feature.title}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography gutterBottom variant="h6" component="h2" align="center">
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => navigate(feature.path)}
                >
                  Explore
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {user && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Quick Stats
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Time Credits
                  </Typography>
                  <Typography variant="h4">{user.time_credits || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Reputation
                  </Typography>
                  <Typography variant="h4">
                    {user.reputation_score?.toFixed(1) || '0.0'} ⭐
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export default Home;
