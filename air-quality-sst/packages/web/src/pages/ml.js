import Head from 'next/head';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useAuth } from 'src/hooks/use-auth';
import { useEffect, useMemo, useState } from 'react';
import { Selector } from 'src/sections/core/Selector';
import { getMlData } from 'src/api/ml';
import { Box, Container, Stack, Typography, Button, CircularProgress } from '@mui/material';

const Page = () => {
  const { user } = useAuth();
  const devices = useMemo(
    () => (!!user ? [...user.adminDevices, ...user.authorizedDevices] : []),
    [user]
  );

  const [device, setDevice] = useState('');
  const [response, setResponse] = useState();
  const [result, setResult] = useState();

  const [isLoading, setIsLoading] = useState(false);

  const onDeviceSelectorChange = (value) => {
    setDevice(value);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const data = await getMlData(user.token, device);
    setIsLoading(false);
    console.log(data);
    setResponse(data);
  };

  useEffect(() => {
    if (response && response.length > 0) {
      const sum = response.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
      setResult(sum / response.length);
    } else {
      setResult(!!response ? 'No Data' : '');
    }
  }, [response]);

  return (
    <>
      <Head>
        <title>ML | Air Quality Monitoring</title>
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
              <Typography variant="h4">ML</Typography>
            </div>
            <div>
              <Typography variant="body1">
                Select a device to classify recent air quality readings
              </Typography>
            </div>
            <div sx={{ p: 4 }}>
              <Box width={200}>
                <Selector
                  defaultText={'Select Device'}
                  items={devices}
                  onChange={onDeviceSelectorChange}
                />
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={!device || isLoading}
                sx={{ mt: 2 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Submit'}
              </Button>
            </div>
            {!!response && (
              <div>
                <Typography>{result}</Typography>
              </div>
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
