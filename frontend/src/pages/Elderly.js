import React from 'react';
import { Typography, Grid, Card, CardContent, Button, Chip, Box } from '@mui/material';
import { useQuery } from 'react-query';
import { elderlyAPI } from '../services/api';

function Elderly() {
  const { data: requests } = useQuery('elderly', () =>
    elderlyAPI.getAll({ status: 'pending' }).then((res) => res.data.requests)
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Elderly Assistance Hub
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Schedule-based help, family monitoring, and alerts for elderly community members
      </Typography>

      <Grid container spacing={3}>
        {requests?.map((request) => (
          <Grid item xs={12} md={6} key={request.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{request.assistance_type}</Typography>
                <Typography variant="body2" paragraph>
                  {request.description}
                </Typography>
                <Chip label={request.status} size="small" color="primary" />
                <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                  Accept Request
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Elderly;
