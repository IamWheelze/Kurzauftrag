import React from 'react';
import { Typography, Grid, Card, CardContent, Button, Chip, Box } from '@mui/material';
import { Add, LocationOn } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { donationsAPI } from '../services/api';

function Donations() {
  const { data: donations } = useQuery('donations', () =>
    donationsAPI.getAll({ status: 'available' }).then((res) => res.data.donations)
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Donations & Swaps</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Donate Item
        </Button>
      </Box>

      <Grid container spacing={3}>
        {donations?.map((donation) => (
          <Grid item xs={12} sm={6} md={4} key={donation.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{donation.title}</Typography>
                <Typography variant="body2" paragraph>
                  {donation.description}
                </Typography>
                <Chip label={donation.category} size="small" />
                {donation.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <LocationOn fontSize="small" />
                    <Typography variant="body2">{donation.location}</Typography>
                  </Box>
                )}
                <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                  Claim Item
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Donations;
