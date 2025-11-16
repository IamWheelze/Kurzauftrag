import React from 'react';
import { Typography, Grid, Card, CardContent, Button, Chip, Box } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { forumAPI } from '../services/api';

function Forum() {
  const { data: posts } = useQuery('forumPosts', () =>
    forumAPI.getPosts().then((res) => res.data.posts)
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Community Forum</Typography>
        <Button variant="contained" startIcon={<Add />}>
          New Post
        </Button>
      </Box>

      <Grid container spacing={3}>
        {posts?.map((post) => (
          <Grid item xs={12} key={post.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip label={post.category} size="small" />
                  {post.is_pinned && <Chip label="Pinned" size="small" color="primary" />}
                </Box>
                <Typography variant="h6">{post.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {post.content.substring(0, 150)}...
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Typography variant="caption">
                    {post.likes_count} likes
                  </Typography>
                  <Typography variant="caption">
                    {post.comments_count} comments
                  </Typography>
                  <Typography variant="caption">
                    by {post.author_name}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Forum;
