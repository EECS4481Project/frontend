import {
  Box, Button, Card, Typography,
} from '@mui/joy';

function Home() {
  return (
    <Box sx={{ height: '100vh', width: '100%' }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems:
        'center',
        height: 'calc(100% - 50px)',
        width: '100%',
        flexDirection: 'column',
      }}
      >
        <Card sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        >
          <Typography level="h4">Welcome 👋</Typography>
          <Typography
            textAlign="center"
            sx={{ marginBottom: '5px' }}
            color="neutral"
          >
            You have questions, and we have answers!
          </Typography>
          <Button component="a" href="/chat">Chat With An Agent</Button>
        </Card>
      </Box>
      <Box sx={{
        height: '50px',
        width: '100%',
        display: 'flex',
        flexDirection: 'row-reverse',
        alignItems: 'center',
      }}
      >
        <Button
          color="neutral"
          component="a"
          href="/dashboard"
          size="sm"
          variant="plain"
          sx={{ marginRight: '10px' }}
        >
          Agent Dashboard
        </Button>
      </Box>
    </Box>
  );
}

export default Home;
