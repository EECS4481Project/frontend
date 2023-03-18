// Chat for anonymous users to agents
import { useEffect, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CircularProgress, Typography,
} from '@mui/joy';
import { toast } from 'react-toastify';
import { createSocket, MessageScreen, ChatScreen } from './CommonChat';
import {
  deleteChatAuthToken, getChatAuthToken, getChatAuthTokenInfo, setQueueBypassToken,
} from '../queue/QueueTokenUtils';
import { TOAST_CONFIG } from '../constants';

function UserChat() {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  // userInfo is {firstName: string, lastName: string, agentUsername: string}
  const [userInfo, setUserInfo] = useState(null);

  const [chat, setChat] = useState([]);
  // Chats format: -- sorted by timestamp
  // {
  //   username: [
  //     {
  // message: string,
  // timestamp: number,
  // correspondentUsername: string,
  // isFromUser: boolean
  //     }
  //   ]
  // }

  // Loading status
  const [isLoading, setIsLoading] = useState(true);
  const [disconnected, setDisconnected] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);

  // Initialize socket
  useEffect(() => {
    setSocket(createSocket());
  }, []);

  // Handle socket responses
  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        setIsLoading(false);
      });

      socket.on('disconnect', () => {
        setDisconnected(true);
      });

      socket.on('transcript', (msg) => {
        setChat((chat) => {
          chat.push(...msg);
          chat.sort((a, b) => a.timestamp < b.timestamp);
          return chat;
        });
        forceUpdate();
      });

      socket.on('message', (msg) => {
        if (msg.toastId) {
          toast.dismiss(msg.toastId);
        }
        setChat((chat) => {
          chat.push(msg);
          return chat;
        });
        forceUpdate();
      });

      socket.on('upload-failure', (data) => {
        toast.dismiss(data.toastId);
        toast(`Failed to upload: ${data.fileName}`, TOAST_CONFIG);
      });

      socket.on('chat-ended', () => {
        setIsChatEnded(true);
      });

      socket.on('agent-changed', (username) => {
        setUserInfo((userInfo) => {
          userInfo.agentUsername = username;
          return userInfo;
        });
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
        navigate('/queue');
      }

      return (() => {
        socket.disconnect();
      });
    }
  }, [socket]);

  const sendMessage = (message) => {
    socket.emit('message', {
      message,
    });
    const messageData = {
      message,
      timestamp: Date.now(),
      correspondentUsername: userInfo.agentUsername,
      isFromUser: true,
    };
    setChat((chat) => {
      chat.push(messageData);
      return chat;
    });
  };

  const sendAttachment = (file, toastId) => {
    socket.emit('file-upload', { file, name: file.name, toastId });
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      {isLoading && !disconnected && <Loading />}
      {disconnected && !isChatEnded && <MessageScreen message="Something went wrong. Refresh the page" />}
      {isChatEnded && <MessageScreen message="Agent ended the chat" />}
      {!isLoading && !disconnected
                && (
                <ChatScreen
                  chat={chat}
                  isAgent={false}
                  sendMessage={sendMessage}
                  sendFile={sendAttachment}
                />
                )}
    </div>
  );
}

function Loading() {
  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      flexGrow: 1,
      flexShrink: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
    >
      <Card sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      >
        <Typography level="h2">
          Loading...
        </Typography>
        <CircularProgress sx={{ mt: 1, mb: 1 }} />
      </Card>
    </Box>
  );
}

export default UserChat;
