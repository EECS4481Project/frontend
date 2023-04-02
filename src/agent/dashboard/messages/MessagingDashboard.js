import {
  useState, useEffect, useReducer, useRef,
} from 'react';
import io, { Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Autocomplete, Badge, Box, Button, Card, CircularProgress, Divider, Input, Tooltip, Typography,
} from '@mui/joy';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import { toast } from 'react-toastify';
import AttachFile from '@mui/icons-material/AttachFile';
import fileDownload from 'js-file-download';
import { getSignedInAgent, getSignedInAgentAuthToken } from '../../utils';
import authorizedAxios from '../../../auth/RequestInterceptor';
import { MESSAGING_INPUT_MAX_LENGTH_SLOT_PROP, TOAST_CONFIG, TOAST_PERSISTENT_CONFIG } from '../../../constants';

const createSocket = () => io({
  path: '/api/start_messaging',
  extraHeaders: { authorization: getSignedInAgentAuthToken() },
});

function MessagingDashboard() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

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
    setChattingWithUsers((chattingWithUsers) => {
      if (!chattingWithUsers.includes(chattingWith)) {
        chattingWithUsers.push(chattingWith);
      }
      return chattingWithUsers;
    });
  }, [chattingWith]);

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
          authorizedAxios.get('/api/auth/is_logged_in').then(() => {
            setSocket(createSocket());
          }).catch(() => {
            // FAILED TO AUTHENTICATE AGENT
            navigate('/login', { replace: true });
          });
        }
      });

      socket.on('disconnect', () => {
        setConnectionFailed(true);
      });

      socket.on('message', (data) => {
        if (data.toastId) {
          toast.dismiss(data.toastId);
        }
        const cleanedData = {
          senderUsername: data.from,
          message: data.message,
          timestamp: data.timestamp,
          fileId: data.fileId,
        };
        // Handle file upload case (socket alerts client who sent file of upload)
        if (data.isSelfMessageTo) {
          data.from = data.isSelfMessageTo;
        }
        setChats((chats) => {
          if (Object.prototype.hasOwnProperty.call(chats, data.from)) {
            chats[data.from].push(cleanedData);
          } else {
            chats[data.from] = [cleanedData];
          }
          return chats;
        });
        if (data.from !== chattingWith) {
          setUnreadMessages((unreadMessages) => {
            if (Object.prototype.hasOwnProperty.call(unreadMessages, data.from)) {
              unreadMessages[data.from] += 1;
            } else {
              unreadMessages[data.from] = 1;
            }
            return unreadMessages;
          });
        }
        // Force update, as we're deeply modifying the object
        forceUpdate();
      });

      socket.on('upload-failure', (data) => {
        toast.dismiss(data.toastId);
        toast(`Failed to upload: ${data.fileName}`, TOAST_CONFIG);
      });

      // Startup handling
      socket.on('chats', async (usernames) => {
        setChattingWithUsers(usernames);
        for (let i = 0; i < usernames.length; i++) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const res = await authorizedAxios
              .post('/api/help_desk_messaging/chat_page_with_username', {
                username: usernames[i],
                latestTimestamp: Date.now(),
              });
            setChats((chats) => {
              if (Object.prototype.hasOwnProperty.call(chats, usernames[i])) {
                chats[usernames[i]].push(...res.data.reverse());
                chats[usernames[i]].sort((a, b) => a.timestamp < b.timestamp);
              } else {
                chats[usernames[i]] = res.data.reverse();
              }
              return chats;
            });
          } catch (err) {
            // Skip chat
          }
        }
        setGotAllChats(true);
      });

      socket.on('all-usernames', (usernames) => {
        setAllUsers(usernames.map((user) => user.username));
        setGotAllUsers(true);
      });

      return (() => {
        socket.disconnect();
      });
    }
  }, [socket]);

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      {(!gotAllChats || !gotAllUsers) && <Loading />}
      {connectionFailed && <ConnectionFailed />}
      {gotAllChats && gotAllUsers && !connectionFailed
        && (
        <div style={{
          display: 'flex', flexDirection: 'row', width: '100%', height: '100%',
        }}
        >
          <SideBar
            allUsers={allUsers}
            chattingWithUsers={chattingWithUsers}
            setChattingWithUsers={setChattingWithUsers}
            setChattingWith={setChattingWith}
            chattingWith={chattingWith}
            socket={socket}
            unreadMessages={unreadMessages}
          />
          {chattingWith == null && (
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
            <Typography level="h4">
              Select a user to message
            </Typography>
          </Box>
          )}
          {chattingWith != null && (
          <ChatScreen
            chattingWith={chattingWith}
            socket={socket}
            chats={chats}
            setChats={setChats}
          />
          )}
        </div>
        )}
    </div>
  );
}

SideBar.propTypes = {
  chattingWithUsers: PropTypes.arrayOf(PropTypes.string),
  setChattingWithUsers: PropTypes.func,
  chattingWith: PropTypes.string,
  setChattingWith: PropTypes.func,
  unreadMessages: PropTypes.objectOf(PropTypes.number),
  allUsers: PropTypes.arrayOf(PropTypes.string),
  socket: PropTypes.instanceOf(Socket),
};

function SideBar({
  chattingWithUsers, setChattingWithUsers,
  chattingWith, setChattingWith, unreadMessages, allUsers, socket,
}) {
  const removeUserFromChattingWith = (username) => {
    // Remove locally
    setChattingWithUsers((chattingWith) => chattingWith.filter((user) => user !== username));
    // Send request
    socket.emit('remove-chat', { username });
  };

  return (
    <Card sx={{
      width: '280px',
      flexGrow: 0,
      flexShrink: 0,
      height: '100%',
      borderRadius: '0 0 0 0',
      display: 'flex',
      flexDirection: 'column',
    }}
    >
      <Autocomplete
        options={allUsers}
        placeholder="Username To Message"
        sx={{ marginRight: '10px' }}
        onChange={(e, newVal) => setChattingWith(newVal)}
      />
      <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} />
      <Box sx={{ overflow: 'auto' }}>
        {chattingWithUsers != null && chattingWithUsers.map(((user) => (
          <Box key={user} sx={{ display: 'flex', flexDirection: 'row' }}>
            <Button
              variant={chattingWith === user ? 'solid' : 'plain'}
              color="neutral"
              sx={{ justifyContent: 'flex-start', width: '100%' }}
              onClick={() => { setChattingWith(user); }}
              endDecorator={
                Object.prototype.hasOwnProperty.call(unreadMessages, user)
              && <Badge sx={{ marginLeft: '10px' }} badgeContent={unreadMessages[user]} />
            }
            >
              {user}
            </Button>
            <Button
              color="danger"
              variant="plain"
              size="sm"
              onClick={() => removeUserFromChattingWith(user)}
            >
              <ClearIcon />

            </Button>
          </Box>
        )))}
      </Box>

    </Card>
  );
}

ChatScreen.propTypes = {
  chattingWith: PropTypes.string,
  chats: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.shape({
    senderUsername: PropTypes.string,
    message: PropTypes.string,
    timestamp: PropTypes.number,
  }))),
  setChats: PropTypes.func,
  socket: PropTypes.instanceOf(Socket),
};

function ChatScreen({
  chattingWith, chats, setChats, socket,
}) {
  const [text, setText] = useState('');
  const [userInfo] = useState(getSignedInAgent());
  const fileUploadEl = useRef();

  const uploadFile = (file) => {
    if (file.size > 2000000) {
      // File too large
      toast.error('File is too large (maximum 2MB)', TOAST_CONFIG);
    } else {
      const toastId = toast.info(`Uploading ${file.name}`, TOAST_PERSISTENT_CONFIG);
      socket.emit('file-upload', {
        file, name: file.name, toUsername: chattingWith, toastId,
      });
    }
  };

  const sendMessage = (message) => {
    socket.emit('message', {
      toUsername: chattingWith,
      message,
    });
    setText('');
    const messageData = {
      senderUsername: userInfo.username,
      message,
      timestamp: Date.now(),
    };
    setChats((chats) => {
      if (Object.prototype.hasOwnProperty.call(chats, chattingWith)) {
        chats[chattingWith].push(messageData);
      } else {
        chats[chattingWith] = [messageData];
      }
      return chats;
    });
  };

  // TODO: We should handle paging rather than returning a max # of messages

  const downloadFile = (href, name) => {
    authorizedAxios.get(href, { responseType: 'blob' }).then((res) => {
      fileDownload(res.data, name, 'image/png');
    }).catch(() => {
      toast('Failed to download file. Try again later.', TOAST_CONFIG);
    });
  };

  return (
    <Box sx={{
      width: '100%',
      flexGrow: 1,
      flexShrink: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
    >
      <Box sx={{ flexGrow: 100000000, flexShrink: 1 }} />
      <Box sx={{
        overflow: 'auto',
        flexGrow: 1,
        flexShrink: 1,
        display: 'flex',
        flexDirection: 'column-reverse',
      }}
      >
        <Box sx={{
          flexGrow: 1, flexShrink: 1, display: 'flex', flexDirection: 'column',
        }}
        >
          {Object.prototype.hasOwnProperty.call(chats, chattingWith)
          && chats[chattingWith].map((msg, i) => (
            <div key={i} style={{ width: '100%' }}>
              <Tooltip title={new Date(msg.timestamp).toLocaleString()}>
                <Typography sx={{
                  width: 'fit-content',
                  float: msg.senderUsername !== userInfo.username ? 'left' : 'right',
                  backgroundColor: msg.senderUsername !== userInfo.username ? '#73738C' : '#3990FF',
                  borderRadius: '20px',
                  padding: '4px 8px 4px 8px',
                  margin: '2px 10px 2px 10px',
                  wordWrap: 'break-word',
                }}
                >
                  {msg.fileId && (
                  // eslint-disable-next-line jsx-a11y/anchor-is-valid
                  <a
                    href=""
                    onClick={(e) => {
                      e.preventDefault();
                      downloadFile(`/api/help_desk_messaging/agent-download/${msg.fileId}`, msg.message);
                    }}
                  >
                    {`Download ${msg.message}`}
                  </a>
                  )}
                  {!msg.fileId && msg.message}
                </Typography>
              </Tooltip>
            </div>
          ))}
        </Box>
      </Box>
      { /* Chat input below */}
      <Card sx={{
        borderRadius: '0 0 0 0', display: 'flex', flexDirection: 'row', marginTop: '4px',
      }}
      >
        <Input
          slotProps={MESSAGING_INPUT_MAX_LENGTH_SLOT_PROP}
          size="sm"
          sx={{ flexGrow: 1, flexShrink: 1 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(event) => {
            if (event.key === 'Enter' && text !== '') sendMessage(text);
          }}
        />
        <input
          ref={fileUploadEl}
          type="file"
          accept="image/*,video/*,.pdf"
          multiple={false}
          onChange={(ev) => uploadFile(ev.target.files[0])}
          hidden
        />
        <Tooltip title="Upload images, videos or PDF files">
          <Button
            size="sm"
            sx={{ flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}
            onClick={() => {
              // Call the hidden file input on click
              fileUploadEl.current.click();
            }}
          >
            <AttachFile />
          </Button>
        </Tooltip>
        <Button
          size="sm"
          disabled={text === ''}
          sx={{ flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}
          onSubmit={() => sendMessage(text)}
        >
          <SendIcon />
        </Button>
      </Card>
    </Box>
  );
}

function ConnectionFailed() {
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
      <Card sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography level="h2">
          Something went wrong. Refresh the page.
        </Typography>
        <CircularProgress sx={{ mt: 1, mb: 1 }} />
      </Card>
    </Box>
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
      <Card sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography level="h2">
          Loading...
        </Typography>
        <CircularProgress sx={{ mt: 1, mb: 1 }} />
      </Card>
    </Box>
  );
}

export default MessagingDashboard;
