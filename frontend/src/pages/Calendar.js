import React from 'react';
import {
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import { Sync } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { calendarAPI } from '../services/api';
import { useSnackbar } from 'notistack';

function Calendar() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: upcomingHolidays } = useQuery('upcomingHolidays', () =>
    calendarAPI.getUpcomingHolidays({ days: 90 }).then((res) => res.data.holidays)
  );

  const { data: events } = useQuery('calendarEvents', () =>
    calendarAPI.getEvents().then((res) => res.data.events)
  );

  const syncMutation = useMutation(calendarAPI.syncGoogle, {
    onSuccess: () => {
      queryClient.invalidateQueries('calendarEvents');
      enqueueSnackbar('Calendar synced successfully!', { variant: 'success' });
    },
    onError: () => {
      enqueueSnackbar('Failed to sync calendar', { variant: 'error' });
    },
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Calendar & Events</Typography>
        <Button
          variant="contained"
          startIcon={<Sync />}
          onClick={() => syncMutation.mutate()}
        >
          Sync Google Calendar
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🌍 Upcoming Holidays & Cultural Events
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Important dates and their cultural significance (especially helpful for newcomers!)
          </Typography>
          <List>
            {upcomingHolidays?.slice(0, 5).map((holiday) => (
              <ListItem key={holiday.id}>
                <ListItemText
                  primary={`${holiday.name} - ${new Date(
                    holiday.date
                  ).toLocaleDateString()}`}
                  secondary={
                    <>
                      <Typography variant="body2">{holiday.description}</Typography>
                      {holiday.cultural_context && (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                          {holiday.cultural_context}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Events
          </Typography>
          {events?.length === 0 ? (
            <Alert severity="info">
              No events yet. Sync your Google Calendar to see your events here!
            </Alert>
          ) : (
            <List>
              {events?.slice(0, 10).map((event) => (
                <ListItem key={event.id}>
                  <ListItemText
                    primary={event.title}
                    secondary={new Date(event.start_time).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Calendar;
