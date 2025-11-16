import React from 'react';
import { Typography, Grid, Card, CardContent, Button, Chip, Box } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { jobsAPI } from '../services/api';

function Jobs() {
  const { data: jobs } = useQuery('jobs', () =>
    jobsAPI.getAll({ status: 'open' }).then((res) => res.data.jobs)
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Mini-Jobs & Youth Tasks</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Post Job
        </Button>
      </Box>

      <Grid container spacing={3}>
        {jobs?.map((job) => (
          <Grid item xs={12} md={6} key={job.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{job.title}</Typography>
                <Typography variant="body2" paragraph>
                  {job.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={job.category} size="small" />
                  {job.is_youth_friendly && (
                    <Chip label="Youth Friendly" size="small" color="success" />
                  )}
                  <Chip
                    label={`${job.credits_offered || job.payment_amount} ${
                      job.payment_type
                    }`}
                    size="small"
                    color="primary"
                  />
                </Box>
                <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                  Apply
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Jobs;
