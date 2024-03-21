import Head from 'next/head';
import { Box, Container, Unstable_Grid2 as Grid, Typography, Stack } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useAuth } from 'src/hooks/use-auth';

const Page = () => {
  const { user } = useAuth();
  return (
    <>
      <Head>
        <title>Overview | Air Quality Monitoring</title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={3}>
            <div>
              <Typography variant="h4">Home</Typography>
            </div>
            <div>
              <Typography variant="h6">{`Hello ${user?.name ?? ''}`}</Typography>
            </div>
            <div>
              <Typography variant="body1">Select a page to view more information</Typography>
            </div>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
