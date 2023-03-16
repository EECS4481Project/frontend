import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CircularProgress, FormControl, FormLabel, Input,
  Modal, ModalDialog, Typography,
} from '@mui/joy';
import { Stack } from '@mui/system';
import { deleteQueueBypassToken, getQueueBypassToken, setChatAuthToken } from './QueueTokenUtils';
import { getSignedInAgent } from '../agent/utils';

const createSocket = () => io({
  path: '/api/start_queue',
});

function Queue() {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [wasDisconnected, setWasDisconnected] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isDoneQueue, setIsDoneQueue] = useState(false);
  const [agentsOnline, setAgentsOnline] = useState(null);
  const [socket, setSocket] = useState(null);

  const queueBypassToken = getQueueBypassToken();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isNameInputOpen, setIsNameInputOpen] = useState(queueBypassToken == null);

  // Redirect to dashboard if an agent
  if (getSignedInAgent()) {
    navigate('/dashboard');
  }

  // Initialize socket
  useEffect(() => {
    setSocket(createSocket());
  }, []);

  // Join queue when user has inputted name
  useEffect(() => {
    if (socket) {
      socket.emit('join_queue', {
        firstName, lastName,
      });
    }
  }, [isNameInputOpen]);

  // Handle socket responses
  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        setWasDisconnected(true);
      });

      socket.on('429', () => {
        setIsRateLimited(true);
      });

      socket.on('bad_auth', () => {
        // Failed to join case
        if (queueBypassToken) {
          deleteQueueBypassToken();
          setIsNameInputOpen(true);
        }
      });

      socket.on('done', (msg) => {
        setChatAuthToken(msg.token);
        setIsDoneQueue(true);
        navigate('/chat');
      });

      socket.on('agents_online', (num) => {
        setAgentsOnline(num);
      });

      // Join queue immediately if we have the bypass token (no need for name input)
      if (queueBypassToken) {
        socket.emit('join_queue', { token: queueBypassToken });
      }

      return (() => {
        socket.disconnect();
      });
    }
  }, [socket]);

  let message = 'Waiting In Queue';
  if (!isConnected) {
    message = 'Joining Queue';
  } else if (isDoneQueue) {
    message = "It's your turn! Joining now.";
  } else if (isRateLimited) {
    message = "You've joined the queue too many times. Try again in 10 minutes.";
  } else if (wasDisconnected) {
    message = 'Something went wrong. Refresh the page';
  }

  let agentsOnlineMessage = '';
  if (agentsOnline === 0) {
    agentsOnlineMessage = 'There are no agents online';
  } else if (agentsOnline === 1) {
    agentsOnlineMessage = `There is ${agentsOnline} agent online`;
  } else if (agentsOnline > 1) {
    agentsOnlineMessage = `There are ${agentsOnline} agents online`;
  }

  return (
    <div>
      <Box sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        justifyContent:
        'center',
        alignItems: 'center',
      }}
      >
        <Card sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography level="h2">
            {message}
          </Typography>
          <CircularProgress sx={{ mt: 1, mb: 1 }} />
          {isConnected && !isDoneQueue && !wasDisconnected && !isRateLimited
          && <Typography>{agentsOnlineMessage}</Typography>}
        </Card>
      </Box>
      <Modal
        open={isNameInputOpen}
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setIsNameInputOpen(false);
          }
        }}
      >
        <NameInputModal
          setOpen={setIsNameInputOpen}
          setFirstName={setFirstName}
          setLastName={setLastName}
        />
      </Modal>
    </div>
  );
}

NameInputModal.propTypes = {
  setFirstName: PropTypes.func,
  setLastName: PropTypes.func,
  setOpen: PropTypes.func,
};

function NameInputModal({ setFirstName, setLastName, setOpen }) {
  const [inputFirstName, setInputFirstName] = useState('');
  const [inputLastName, setInputLastName] = useState('');

  const handleSubmit = (firstName, lastName) => {
    if (firstName !== '' && lastName !== '') {
      setFirstName(firstName);
      setLastName(lastName);
      setOpen(false);
    }
  };

  return (
    <ModalDialog
      sx={{ maxWidth: 500 }}
    >
      <Typography id="basic-modal-dialog-title" component="h2">
        Welcome! What&apos;s your name?
      </Typography>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(inputFirstName, inputLastName);
        }}
      >
        <Stack>
          <FormControl>
            <FormLabel>First Name</FormLabel>
            <Input
              autoFocus
              required
              type="text"
              placeholder="John"
              onChange={(e) => setInputFirstName(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Last Name</FormLabel>
            <Input
              required
              type="text"
              placeholder="Doe"
              onChange={(e) => setInputLastName(e.target.value)}
            />
          </FormControl>
          <FormControl>
            {(inputFirstName === '' || inputLastName === '')
            && <Button disabled type="submit" sx={{ mt: 1 }}>Continue</Button>}
            {inputFirstName !== '' && inputLastName !== ''
            && <Button type="submit" sx={{ mt: 1 }}>Continue</Button>}
          </FormControl>
        </Stack>
      </form>
    </ModalDialog>
  );
}

export default Queue;
