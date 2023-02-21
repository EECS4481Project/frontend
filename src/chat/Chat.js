// Note: This component handles both users & agents
import { useState, useEffect, useReducer } from 'react';
import io from 'socket.io-client';
import { getSignedInAgent } from '../agent/utils';
import { deleteChatAuthToken, getChatAuthToken, getChatAuthTokenInfo, setQueueBypassToken } from '../queue/QueueTokenUtils';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CircularProgress, Input, Tooltip, Typography } from '@mui/joy';
import { Box } from '@mui/system';
import ClearIcon from '@mui/icons-material/Clear';
import SendIcon from '@mui/icons-material/Send';

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

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {agent && <AgentChat username={agent.username} />}
      {!agent && <UserChat />}
    </div>
  );
}

function AgentChat(props) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const location = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  // Users are of the format {userId: str, firstName: str, lastName: str}
  // Only the userId should be used to communicate with the user
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [chattingWith, setChattingWith] = useState(null); // Current user being messaged
  const [unreadMessages, setUnreadMessages] = useState({});
  const [chats, setChats] = useState({});
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

  // Loading states
  // Flag for if the agent is online in the chat or not
  // Ie. so we know to display the chat, or a join chat button
  const [isAgentInChat, setIsAgentInChat] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

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
      });

      socket.on('disconnect', (msg) => {
        setDisconnected(true);
      });

      socket.on('started-agent-chat', () => {
        setIsAgentInChat(true);
      });

      // When the queue assigned a user to the agent
      // NOTE: They haven't joined the chat yet -- only finished the queue
      socket.on('assigned_user', (user) => {
        setAssignedUsers(assignedUsers => [...assignedUsers, user])
        // Create the chat between the agent and user
        setChats(chats => ({
          ...chats,
          userId: []
        }))
      })

      socket.on('transcript', msg => {
        setChats(chats => {
          if (chats.hasOwnProperty(msg.userId)) {
            chats[msg.userId].push(...msg);
            chats[msg.userId].sort((a, b) => a.timestamp < b.timestamp);
          } else {
            chats[msg.userId] = msg.transcript;
          }
          return chats;
        });
        forceUpdate();
      })

      socket.on('message', data => {
        const toStore = {...data};
        toStore['correspondentUsername'] = props.username;
        setChats(chats => {
          if (chats.hasOwnProperty(data.correspondentUsername)) {
            chats[data.correspondentUsername].push(toStore)
          } else {
            chats[data.correspondentUsername] = [toStore]
          }
          return chats;
        });
        if (data.correspondentUsername !== chattingWith) {
          setUnreadMessages(unreadMessages => {
            if (unreadMessages.hasOwnProperty(data.correspondentUsername)) {
              unreadMessages[data.correspondentUsername] += 1;
            } else {
              unreadMessages[data.correspondentUsername] = 1;
            }
            return unreadMessages;
          })
        }
        // Required do to deep chat change
        forceUpdate();
      })

      // When the user leaves the chat
      socket.on('user_disconnect', (userId) => {
        // Remove user from chattingWith if needed
        setChattingWith(chattingWith => {
          if (chattingWith === userId) {
            return null;
          }
          return chattingWith;
        })
        // Remove user from assigned users
        setAssignedUsers(assignedUsers => assignedUsers.filter((user) => {
          return user.userId !== userId;
        }))
        // Remove chat logs
        setChats(chats => {
          delete chats[userId];
          return chats;
        })
        // Remove unread messages
        setUnreadMessages(unreadMessages => {
          delete unreadMessages[userId];
          return unreadMessages;
        })
      })

      return (() => {
        socket.disconnect();
      })
    }
  }, [socket])

  const startAgentChat = () => {
    if (socket) {
      socket.emit('agent-login');
    }
  }

  const sendMessage = (message) => {
    socket.emit('message', {
      userId: chattingWith,
      message: message
    });
    const messageData = {
      message: message,
      timestamp: Date.now(),
      correspondentUsername: props.username,
      isFromUser: false
    };
    setChats(chats => {
      if (chats.hasOwnProperty(chattingWith)) {
        chats[chattingWith].push(messageData)
      } else {
        chats[chattingWith] = [messageData]
      }
      return chats;
    })
    // Required do to deep chat change
    forceUpdate();
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {!isAgentInChat && !disconnected && <AgentJoinChat onClick={startAgentChat} />}
      {disconnected && <MessageScreen message="Something went wrong. Refresh the page" />}
      {isAgentInChat && !disconnected &&
        <div style={{ display: 'flex', width: '100%', height: '100%', flexDirection: 'row' }}>
          <SideBar chattingWithUsers={assignedUsers} setChattingWithUsers={setAssignedUsers} socket={socket} chattingWith={chattingWith} setChattingWith={setChattingWith} unreadMessages={unreadMessages} />
          {chattingWith && <ChatScreen chat={chats[chattingWith]} isAgent={true} sendMessage={sendMessage} />}
          {!chattingWith && <MessageScreen message="Select a user to start chatting" />}
        </div>
      }
    </div>
  );
}

function UserChat() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  // userInfo is {firstName: string, lastName: string, agentUsername: string} -- unsafe. should only be used for UI
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

      // TODO: On transfer, update agentUsername

      socket.on('disconnect', (msg) => {
        setDisconnected(true);
      });

      socket.on('transcript', (msg) => {
        setChat(chat => {
          chat.push(...msg);
          chat.sort((a, b) => a.timestamp < b.timestamp);
          return chat;
        });
        forceUpdate();
      })

      socket.on('message', msg => {
        setChat(chat => {
          chat.push(msg);
          return chat;
        })
        forceUpdate();
      })

      socket.on('chat-ended', msg => {
        setIsChatEnded(true);
      })

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

  const sendMessage = (message) => {
    socket.emit('message', {
      message: message
    });
    const messageData = {
      message: message,
      timestamp: Date.now(),
      correspondentUsername: userInfo.agentUsername,
      isFromUser: true
    };
    setChat(chat => {
      chat.push(messageData);
      return chat;
    })
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      {isLoading && !disconnected && <Loading />}
      {disconnected && !isChatEnded && <MessageScreen message="Something went wrong. Refresh the page" />}
      {isChatEnded && <MessageScreen message="Agent ended the chat" />}
      {!isLoading && !disconnected &&
        <ChatScreen chat={chat} isAgent={false} sendMessage={sendMessage} />
      }
    </div>
  );
}

function SideBar(props) {
  const removeUserFromChattingWith = (userId) => {
    // Send request
    props.socket.emit('end-chat', { userId: userId });
  }
  return <Card sx={{ width: '280px', flexGrow: 0, flexShrink: 0, height: '100%', borderRadius: '0 0 0 0', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ overflow: 'auto' }}>
      {props.chattingWithUsers != null && props.chattingWithUsers.map((user => {
        return <Box key={user.userId} sx={{ display: 'flex', flexDirection: 'row' }}>
          <Button variant={props.chattingWith === user.userId ? 'solid' : 'plain'} color='neutral' sx={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={(e) => { props.setChattingWith(user.userId) }}
            endDecorator={
              props.unreadMessages.hasOwnProperty(user.userId) &&
              <Badge sx={{ marginLeft: '10px' }} badgeContent={props.unreadMessages[user.userId]}></Badge>
            }
          >
            {user.firstName + " " + user.lastName}
          </Button>
          <Button color='danger' variant='plain' size='sm' onClick={() => removeUserFromChattingWith(user.userId)}><ClearIcon /></Button>
        </Box>
      }))}
    </Box>

  </Card>
}

function ChatScreen(props) {
  const [text, setText] = useState('');

  let correspondentUsername = null;
  return <Box sx={{ width: '100%', flexGrow: 1, flexShrink: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ flexGrow: 100000000, flexShrink: 1 }}></Box>
    <Box sx={{ overflow: 'auto', flexGrow: 1, flexShrink: 1, display: 'flex', flexDirection: 'column-reverse' }}>
      <Box sx={{ flexGrow: 1, flexShrink: 1, display: 'flex', flexDirection: 'column' }}>
        {props.chat && props.chat.map((msg, i) => {
          // Handle styling (if message is from or to the user)
          let isFrom = true;
          if (msg.isFromUser && !props.isAgent) {
            isFrom = false;
          } else if (!msg.isFromUser && props.isAgent) {
            isFrom = false;
          }
          // Check if agent username should be displayed
          let showUsername = false;
          if (msg.correspondentUsername !== correspondentUsername) {
            showUsername = true;
            correspondentUsername = msg.correspondentUsername;
          }
          return <div key={i} style={{ width: '100%' }}>
            {showUsername &&
            <Typography color='neutral' textAlign='center' sx={{width: '100%'}}>
              {props.isAgent ? `Agent: ${msg.correspondentUsername}` : `Chatting with ${msg.correspondentUsername}`}
              </Typography>
            }
            <Tooltip title={new Date(msg.timestamp).toLocaleString()}>
              <Typography sx={{ width: 'fit-content', float: isFrom ? 'left' : 'right', backgroundColor: isFrom ? '#73738C' : '#3990FF', borderRadius: '20px', padding: '4px 8px 4px 8px', margin: '2px 10px 2px 10px', wordWrap: 'break-word' }}>
                {msg.message}
              </Typography>
            </Tooltip>
          </div>
        })}
      </Box>
    </Box>
    { /* Chat input below */}
    <Card sx={{ borderRadius: '0 0 0 0', display: 'flex', flexDirection: 'row', marginTop: '4px' }}>
      <Input size="sm" sx={{ flexGrow: 1, flexShrink: 1 }} value={text} onChange={(e) => setText(e.target.value)} onKeyPress={(event) => {
        if (event.key === 'Enter' && text !== "") {
          props.sendMessage(text);
          setText("");
        }
      }} />
      <Button size="sm" disabled={text === ''} sx={{ flexGrow: 0, flexShrink: 0, marginLeft: '10px' }} onSubmit={(e) => {
        setText(""); props.sendMessage(text)
      }}>
        <SendIcon />
      </Button>
    </Card>
  </Box>
}

function Loading() {
  return <Box sx={{ width: '100%', height: '100%', flexGrow: 1, flexShrink: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <Card sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Typography level="h2">
        Loading...
      </Typography>
      <CircularProgress sx={{ mt: 1, mb: 1 }} />
    </Card>
  </Box>;
}

function AgentJoinChat(props) {
  return <Box sx={{ width: '100%', height: '100%', flexGrow: 1, flexShrink: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
    <Typography>Not current in chat queue.</Typography>
    <Button onClick={props.onClick}>Join Chat</Button>
  </Box>;
}

function MessageScreen(props) {
  return <Box sx={{ width: '100%', height: '100%', flexGrow: 1, flexShrink: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
    <Typography>{props.message}</Typography>
  </Box>;
}

export default Chat;