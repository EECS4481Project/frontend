import './MessagingDashboard.css';
import { useState, useEffect, useReducer } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Autocomplete, Badge, Box, Button, Card, CircularProgress, Divider, Input, Tooltip, Typography } from '@mui/joy';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import { getSignedInAgent } from '../../utils';

const createSocket = () => {
  return io({
    path: "/api/start_messaging",
  });
}

function MessagingDashboard() {
  let navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const [gotAllChats, setGotAllChats] = useState(false);
  const [gotAllUsers, setGotAllUsers] = useState(false);

  const [connectionFailed, setConnectionFailed] = useState(false);
  const [chattingWithUsers, setChattingWithUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [chattingWith, setChattingWith] = useState(null);

  const [unreadMessages, setUnreadMessages] = useState({});

  const [chats, setChats] = useState({});
  // Chats format: -- sorted by timestamp
  // {
  //   username: [
  //     {
  //       senderUsername: string,
  //       message: string,
  //       timestamp: int
  //     }
  //   ]
  // }

  // Get required data

  // Initialize socket
  useEffect(() => {
    setSocket(createSocket());
  }, []);

  useEffect(() => {
    const tmpUnreadMessages = { ...unreadMessages };
    delete tmpUnreadMessages[chattingWith];
    setUnreadMessages(tmpUnreadMessages);
  }, [chattingWith])

  // Handle socket responses
  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        socket.emit('get-chats');
        socket.emit('get-all-usernames');
      });

      // Handle authentication
      socket.on('connect_error', (err) => {
        socket.disconnect();
        // Reset values
        setGotAllChats(false);
        setGotAllUsers(false);
        // Handle auth
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
        setConnectionFailed(true);
      });

      socket.on('message', (data) => {
        const cleanedData = {
          senderUsername: data.from,
          message: data.message,
          timestamp: data.timestamp
        };
        setChats(chats => {
          if (chats.hasOwnProperty(data.from)) {
            chats[data.from].push(cleanedData)
          } else {
            chats[data.from] = [cleanedData]
          }
          return chats;
        });
        if (data.from !== chattingWith) {
          setUnreadMessages(unreadMessages => {
            if (unreadMessages.hasOwnProperty(data.from)) {
              unreadMessages[data.from] += 1;
            } else {
              unreadMessages[data.from] = 1;
            }
            return unreadMessages;
          })
        }
        // Force update, as we're deeply modifying the object
        forceUpdate();
      });



      // Startup handling
      socket.on('chats', async (usernames) => {
        setChattingWithUsers(usernames);
        for (let i = 0; i < usernames.length; i++) {
          try {
            const res = await axios.post('/api/help_desk_messaging/chat_page_with_username', {
              username: usernames[i],
              latestTimestamp: Date.now()
            });
            setChats(chats => {
              if (chats.hasOwnProperty(usernames[i])) {
                chats[usernames[i]].push(...res.data.reverse())
                chats[usernames[i]].sort((a, b) => a.timestamp < b.timestamp);
              } else {
                chats[usernames[i]] = res.data.reverse();
              }
              return chats;
            })
          } catch (err) {
            console.error(err);
          }
        }
        setGotAllChats(true);
      })

      socket.on('all-usernames', usernames => {
        setAllUsers(usernames.map(user => user.username));
        setGotAllUsers(true);
      })

      return (() => {
        socket.disconnect();
      })
    }
  }, [socket])

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      {(!gotAllChats || !gotAllUsers) && <Loading />}
      {connectionFailed && <ConnectionFailed />}
      {gotAllChats && gotAllUsers && !connectionFailed &&
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
          <SideBar allUsers={allUsers} chattingWithUsers={chattingWithUsers} setChattingWithUsers={setChattingWithUsers} setChattingWith={setChattingWith} chattingWith={chattingWith} socket={socket} unreadMessages={unreadMessages} />
          {chattingWith == null && <Box sx={{ width: '100%', height: '100%', flexGrow: 1, flexShrink: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography level="h4">
              Select a user to message
            </Typography>
          </Box>}
          {chattingWith != null && <ChatScreen chattingWith={chattingWith} socket={socket} chats={chats} setChats={setChats} />}
        </div>
      }
    </div>
  );
}

function SideBar(props) {
  const removeUserFromChattingWith = (username) => {
    // Remove locally
    props.setChattingWithUsers(chattingWith => {
      chattingWith.filter(user => user !== username)
    });
    // Send request
    props.socket.emit('remove-chat', { username: username });
  }

  return <Card sx={{ width: '280px', flexGrow: 0, flexShrink: 0, height: '100%', borderRadius: '0 0 0 0', display: 'flex', flexDirection: 'column' }}>
    <Autocomplete options={props.allUsers} placeholder="Username To Message"
      sx={{ marginRight: '10px' }}
      onChange={(e, newVal) => props.setChattingWith(newVal)} />
    <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} />
    <Box sx={{ overflow: 'auto' }}>
      {props.chattingWithUsers != null && props.chattingWithUsers.map((user => {
        return <Box key={user} sx={{ display: 'flex', flexDirection: 'row' }}>
          <Button variant={props.chattingWith === user ? 'solid' : 'plain'} color='neutral' sx={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={(e) => { props.setChattingWith(user) }}
            endDecorator={
              props.unreadMessages.hasOwnProperty(user) &&
              <Badge sx={{ marginLeft: '10px' }} badgeContent={props.unreadMessages[user]}></Badge>
            }
          >
            {user}
          </Button>
          <Button color='danger' variant='plain' size='sm' onClick={() => removeUserFromChattingWith(user)}><ClearIcon /></Button>
        </Box>
      }))}
    </Box>

  </Card>
}

function ChatScreen(props) {
  const [text, setText] = useState('');
  const [userInfo,] = useState(getSignedInAgent());

  const sendMessage = (message) => {
    props.socket.emit('message', {
      toUsername: props.chattingWith,
      message: message
    });
    setText("");
    const messageData = {
      senderUsername: userInfo.username,
      message: message,
      timestamp: Date.now()
    };
    props.setChats(chats => {
      if (chats.hasOwnProperty(props.chattingWith)) {
        chats[props.chattingWith].push(messageData)
      } else {
        chats[props.chattingWith] = [messageData]
      }
      return chats;
    })
  }

  // TODO: We should handle paging rather than returning a max # of messages


  return <Box sx={{ width: '100%', flexGrow: 1, flexShrink: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ flexGrow: 100000000, flexShrink: 1 }}></Box>
    <Box sx={{ overflow: 'auto', flexGrow: 1, flexShrink: 1, display: 'flex', flexDirection: 'column-reverse' }}>
      <Box sx={{ flexGrow: 1, flexShrink: 1, display: 'flex', flexDirection: 'column' }}>
        {props.chats.hasOwnProperty(props.chattingWith) && props.chats[props.chattingWith].map((msg, i) => {
          return <div key={i} style={{ width: '100%' }}>
            <Tooltip title={new Date(msg.timestamp).toLocaleString()}>
              <Typography sx={{width: 'fit-content', float: msg.senderUsername !== userInfo.username ? 'left' : 'right', backgroundColor: msg.senderUsername !== userInfo.username ? '#73738C' : '#3990FF', borderRadius: '20px', padding: '4px 8px 4px 8px', margin: '2px 10px 2px 10px', wordWrap: 'break-word' }}>
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
        if (event.key === 'Enter' && text !== "")
          sendMessage(text);
      }} />
      <Button size="sm" disabled={text === ''} sx={{ flexGrow: 0, flexShrink: 0, marginLeft: '10px' }} onSubmit={(e) => sendMessage(text)}>
        <SendIcon />
      </Button>
    </Card>
  </Box>
}

function ConnectionFailed() {
  return <Box sx={{ width: '100%', height: '100%', flexGrow: 1, flexShrink: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <Card sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Typography level="h2">
        Something went wrong. Refresh the page.
      </Typography>
      <CircularProgress sx={{ mt: 1, mb: 1 }} />
    </Card>
  </Box>;
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

export default MessagingDashboard;