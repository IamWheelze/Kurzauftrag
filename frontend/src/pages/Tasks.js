import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Box,
} from '@mui/material';
import { Add, LocationOn } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { tasksAPI } from '../services/api';
import { useSnackbar } from 'notistack';

function Tasks() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    task_type: 'one_time',
    location: '',
    payment_type: 'credits',
    credits_offered: 10,
  });

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: tasks, isLoading } = useQuery('tasks', () =>
    tasksAPI.getAll({ status: 'open' }).then((res) => res.data.tasks)
  );

  const createMutation = useMutation(tasksAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('tasks');
      setOpen(false);
      enqueueSnackbar('Task created successfully!', { variant: 'success' });
      setFormData({
        title: '',
        description: '',
        category: 'general',
        task_type: 'one_time',
        location: '',
        payment_type: 'credits',
        credits_offered: 10,
      });
    },
  });

  const acceptMutation = useMutation(tasksAPI.accept, {
    onSuccess: () => {
      queryClient.invalidateQueries('tasks');
      enqueueSnackbar('Task accepted!', { variant: 'success' });
    },
  });

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const handleAccept = (taskId) => {
    acceptMutation.mutate(taskId);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Tasks & Errands</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Post Task
        </Button>
      </Box>

      <Grid container spacing={3}>
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : tasks?.length === 0 ? (
          <Typography>No tasks available</Typography>
        ) : (
          tasks?.map((task) => (
            <Grid item xs={12} md={6} lg={4} key={task.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {task.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {task.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip label={task.category} size="small" />
                    <Chip
                      label={`${task.credits_offered} credits`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                  {task.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{task.location}</Typography>
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary" display="block">
                    Posted by: {task.creator_name}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => handleAccept(task.id)}
                  >
                    Accept Task
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Post a New Task</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <MenuItem value="cleaning">Cleaning</MenuItem>
              <MenuItem value="dog_walking">Dog Walking</MenuItem>
              <MenuItem value="groceries">Groceries</MenuItem>
              <MenuItem value="general">General</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Credits Offered"
            type="number"
            value={formData.credits_offered}
            onChange={(e) =>
              setFormData({ ...formData, credits_offered: parseInt(e.target.value) })
            }
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Post Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Tasks;
