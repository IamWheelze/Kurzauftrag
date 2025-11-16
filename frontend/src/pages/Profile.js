import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Chip,
  Grid,
  Rating,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={user.profile_picture}
              alt={user.name}
              sx={{ width: 100, height: 100, mr: 3 }}
            />
            <Box>
              <Typography variant="h5">{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Box sx={{ mt: 1 }}>
                {user.is_verified && (
                  <Chip label="Verified" size="small" color="success" sx={{ mr: 1 }} />
                )}
                {user.is_elderly && (
                  <Chip label="Elderly" size="small" color="info" />
                )}
              </Box>
            </Box>
          </Box>

          {user.bio && (
            <Typography variant="body1" paragraph>
              {user.bio}
            </Typography>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              📍 {user.city || 'Location not set'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📅 Member since {new Date(user.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Time Credits
              </Typography>
              <Typography variant="h4">{user.time_credits || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Reputation
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating value={user.reputation_score || 0} readOnly />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {user.reputation_score?.toFixed(1) || '0.0'}
                </Typography>
              </Box>
              <Typography variant="caption">
                {user.total_ratings || 0} ratings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile;
