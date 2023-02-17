import './MessagingDashboard.css';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

// NOTE: Some boiler plate for agent only connection

const createSocket = () => {
  return io({
    path: "/api/start_messaging",
  });
}

function MessagingDashboard() {
  let navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [lastPong, setLastPong] = useState(null);
  const [socket, setSocket] = useState(null);

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

      // Handle authentication
      socket.on('connect_error', (err) => {
        socket.disconnect();
        if (err.message === 'auth') {
          axios.get('/api/auth/is_logged_in').then(() => {
            setSocket(createSocket());
          }).catch(err => {
            // FAILED TO AUTHENTICATE AGENT
            navigate('/login');
          });
        }
      });

      socket.on('disconnect', (msg) => {
        console.log(msg)
        console.log('dc')
        setIsConnected(false);
      });

      socket.on('pong', () => {
        setLastPong(new Date().toISOString());
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

  return (
    <div>
      <p>Connected: {'' + isConnected}</p>
      <p>Last pong: {lastPong || '-'}</p>
      <button onClick={sendPing}>Send ping</button>
    </div>
  );
}

export default MessagingDashboard;