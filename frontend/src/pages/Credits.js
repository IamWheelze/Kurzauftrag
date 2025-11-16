import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Box,
  List,
  ListItem,
  ListItemText,
  Grid,
  Avatar,
} from '@mui/material';
import { useQuery } from 'react-query';
import { creditsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function Credits() {
  const { user } = useAuth();

  const { data: transactions } = useQuery('transactions', () =>
    creditsAPI.getTransactions().then((res) => res.data.transactions)
  );

  const { data: leaderboard } = useQuery('leaderboard', () =>
    creditsAPI.getLeaderboard().then((res) => res.data.leaderboard)
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Time Credits
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Balance
              </Typography>
              <Typography variant="h3" color="primary">
                {user?.time_credits || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Time Credits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <List>
                {transactions?.slice(0, 10).map((transaction) => (
                  <ListItem key={transaction.id}>
                    <ListItemText
                      primary={transaction.description}
                      secondary={new Date(transaction.created_at).toLocaleDateString()}
                    />
                    <Typography
                      variant="body2"
                      color={
                        transaction.to_user_id === user?.id ? 'success.main' : 'error.main'
                      }
                    >
                      {transaction.to_user_id === user?.id ? '+' : '-'}
                      {transaction.amount}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏆 Leaderboard
              </Typography>
              <List>
                {leaderboard?.slice(0, 10).map((user, index) => (
                  <ListItem key={user.id}>
                    <Box sx={{ mr: 2, minWidth: 30 }}>
                      <Typography variant="h6">{index + 1}</Typography>
                    </Box>
                    <Avatar src={user.profile_picture} sx={{ mr: 2 }} />
                    <ListItemText primary={user.name} />
                    <Typography variant="body2">{user.time_credits} credits</Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Credits;
