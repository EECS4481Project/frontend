import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useNavigate } from "react-router-dom";
import { Button, FormControl, FormLabel, Input, Modal, ModalDialog, Typography } from '@mui/joy';
import { deleteQueueBypassToken, getQueueBypassToken, setChatAuthToken } from './QueueTokenUtils';
import { Stack } from '@mui/system';
import { getSignedInAgent } from '../agent/utils';

const createSocket = () => {
  return io({
    path: "/api/start_queue",
    query: { "name": "xyz" },
  });
}

function Queue() {
  let navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [lastPong, setLastPong] = useState(null);
  const [socket, setSocket] = useState(null);

  const queueBypassToken = getQueueBypassToken();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
        firstName, lastName
      })
    }
  }, [isNameInputOpen])

  // Handle socket responses
  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        setIsConnected(true);
      });

      socket.on('disconnect', (msg) => {
        setIsConnected(false);
      });

      socket.on('bad_auth', () => {
        // Failed to join case
        if (queueBypassToken) {
          deleteQueueBypassToken();
          setIsNameInputOpen(true);
        }
      })

      socket.on('try_again', () => {
        // TODO: Display try again msg
      })

      socket.on('done', (msg) => {
        console.log('got done!', msg);
        setChatAuthToken(msg.token);
        navigate('/chat');
      });

      socket.on('pong', () => {
        setLastPong(new Date().toISOString());
      });

      // Join queue immediately if we have the bypass token (no need for name input)
      if (queueBypassToken) {
        socket.emit('join_queue', { token: queueBypassToken });
      }

      return (() => {
        socket.disconnect();
      })
    }
  }, [socket])

  const sendPing = () => {
    if (socket) {
      socket.emit('join_queue', { firstName: "John", lastName: "doe" });
      socket.emit('test');
    }
  }

  return (
    <div>
      <p>Connected: {'' + isConnected}</p>
      <p>Last pong: {lastPong || '-'}</p>
      <button onClick={sendPing}>Send ping</button>
      <Modal open={isNameInputOpen} onClose={(e, reason) => {
        if (reason !== "backdropClick") {
          setIsNameInputOpen(false);
        }
      }
      }>
        <NameInputModal setOpen={setIsNameInputOpen} setFirstName={setFirstName} setLastName={setLastName} />
      </Modal>
    </div>
  );
}

function NameInputModal(props) {

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleSubmit = (firstName, lastName) => {
    if (firstName !== "" && lastName !== "") {
      props.setFirstName(firstName);
      props.setLastName(lastName);
      props.setOpen(false);
    }
  }

  return (
    <ModalDialog
      sx={{ maxWidth: 500 }}
    >
      <Typography id="basic-modal-dialog-title" component="h2">
        Welcome! What's your name?
      </Typography>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(firstName, lastName);
        }}
      >
        <Stack>
          <FormControl>
            <FormLabel>First Name</FormLabel>
            <Input autoFocus required type="text" placeholder="John" onChange={e => setFirstName(e.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel>Last Name</FormLabel>
            <Input required type="text" placeholder="Doe" onChange={e => setLastName(e.target.value)} />
          </FormControl>
          <FormControl>
            {(firstName === "" || lastName === "") && <Button disabled type='submit' sx={{ mt: 1 }}>Continue</Button>}
            {firstName !== "" && lastName !== "" && <Button type='submit' sx={{ mt: 1 }}>Continue</Button>}
          </FormControl>
        </Stack>
      </form>
    </ModalDialog>
  );

}

export default Queue;
