// Note: This component should handle both agents & users
import './Chat.css';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { getSignedInAgent } from '../agent/utils';
import { deleteChatAuthToken, getChatAuthToken, getChatAuthTokenInfo, setQueueBypassToken } from '../queue/QueueTokenUtils';
import { useLocation, useNavigate } from 'react-router-dom';

// NOTE: Some boiler plate for knowing if a request is from an agent or user
// and making required calls for queue.

const createSocket = () => {
  return io({
    path: "/api/start_chat",
  });
}

function Chat() {
  // To know if the person using this page is a user or agent:
  // Note: This is insecure, so our backend should also run checks
  const [agent, setAgent] = useState(getSignedInAgent());
  if (agent) {
    console.log(agent.username, agent.firstName, agent.lastName);
  } else {
    console.log("not an agent -- must be a user");
  }

  return (
    <div>
      {agent && <AgentChat />}
      {!agent && <UserChat />}
    </div>
  );
}

function AgentChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [lastPong, setLastPong] = useState(null);
  const [socket, setSocket] = useState(null);
  // Flag for if the agent is online in the chat or not
  // Ie. so we know to display the chat, or a join chat button
  const [isAgentInChat, setIsAgentInChat] = useState(false);

  if (location.pathname === '/chat') {
    navigate('/dashboard');
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

      socket.on('started-agent-chat', () => {
        setIsAgentInChat(true);
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

  const startAgentChat = () => {
    if (socket) {
      socket.emit('agent-login');
    }
  }

  return (
    <div>
      <p>Connected: {'' + isConnected}</p>
      <p>Last pong: {lastPong || '-'}</p>
      <button onClick={sendPing}>Send ping</button>
      {!isAgentInChat && <button onClick={startAgentChat}>Join chat</button>}
    </div>
  );
}

function UserChat() {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [lastPong, setLastPong] = useState(null);
  const [socket, setSocket] = useState(null);

  // userInfo is {firstName: string, lastName: string} -- unsafe. should only be used for UI
  const [userInfo, setUserInfo] = useState(null);

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

      // Queue functionality

      socket.on('enqueue', (msg) => {
        // Push token to localStorage & redirect
        setQueueBypassToken(msg.token);
        navigate('/queue');
      });

      socket.on('auth_failed', () => {
        // Redirect to queue
        navigate('/queue');
      });

      // Start live chat once socket is setup
      const authKey = getChatAuthToken();
      if (socket && authKey) {
        socket.emit('user-login', { token: authKey });
        setUserInfo(getChatAuthTokenInfo());
        deleteChatAuthToken();
      } else {
        navigate('/queue')
      }

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

  return (
    <div>
      <p>Connected: {'' + isConnected}</p>
      {userInfo && <div>
        <p>User: {userInfo.firstName + " " + userInfo.lastName}</p>
      </div>}
      <p>Last pong: {lastPong || '-'}</p>
      <button onClick={sendPing}>Send ping</button>
    </div>
  );
}

export default Chat;