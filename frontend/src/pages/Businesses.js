import React from 'react';
import { Typography, Grid, Card, CardContent, Chip, Box, Rating } from '@mui/material';
import { useQuery } from 'react-query';
import { businessesAPI } from '../services/api';

function Businesses() {
  const { data: businesses } = useQuery('businesses', () =>
    businessesAPI.getAll().then((res) => res.data.businesses)
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Local Business Listings
      </Typography>

      <Grid container spacing={3}>
        {businesses?.map((business) => (
          <Grid item xs={12} md={6} key={business.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  {business.is_verified && (
                    <Chip label="Verified" size="small" color="success" />
                  )}
                  {business.is_promoted && (
                    <Chip label="Promoted" size="small" color="primary" />
                  )}
                </Box>
                <Typography variant="h6">{business.business_name}</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {business.description}
                </Typography>
                <Chip label={business.category} size="small" />
                <Box sx={{ mt: 1 }}>
                  <Rating value={business.rating || 0} readOnly size="small" />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    ({business.total_reviews} reviews)
                  </Typography>
                </Box>
                {business.phone && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    📞 {business.phone}
                  </Typography>
                )}
                {business.website && (
                  <Typography variant="body2">
                    🌐 {business.website}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Businesses;
