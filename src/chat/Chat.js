// Note: This component should handle both agents & users
import './Chat.css';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { getSignedInAgent } from '../agent/utils';

// NOTE: Some boiler plate for knowing if a request is from an agent or user.

const createSocket = () => {
  return io({
    path: "/api/start_chat",
  });
}

function Chat() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastPong, setLastPong] = useState(null);
  const [lastAgentOnlyPong, setAgentOnlyLastPong] = useState(null);
  const [socket, setSocket] = useState(null);

  // To know if the person using this page is a user or agent:
  // Note: This is insecure, so our backend should also run checks
  const agent = getSignedInAgent();
  if (agent) {
    console.log(agent.username, agent.firstName, agent.lastName);
  } else {
    console.log("not an agent -- must be a user");
  }

  // Initialize socket
  useEffect(() => {
    setSocket(createSocket());
  }, []);

  // Handle socket responses
  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        setIsConnected(true);
      });

      socket.on('disconnect', (msg) => {
        setIsConnected(false);
      });

      socket.on('pong', () => {
        setLastPong(new Date().toISOString());
      });

      socket.on('agent-pong', () => {
        setAgentOnlyLastPong(new Date().toISOString());
      });

      return (() => {
        socket.disconnect();
      })
    }
  }, [socket])

  const sendPing = () => {
    if (socket) {
      socket.emit('ping');
    }
  }

  const sendAgentOnlyPing = () => {
    if (socket) {
      socket.emit('agent-ping');
    }
  }

  return (
    <div>
      <p>Connected: {'' + isConnected}</p>
      <p>Last pong: {lastPong || '-'}</p>
      {agent && <p>Last agent only pong: {lastAgentOnlyPong || '-'}</p>}
      <button onClick={sendPing}>Send ping</button>
      {agent && <button onClick={sendAgentOnlyPing}>Send agent only ping</button>}
    </div>
  );
}

export default Chat;