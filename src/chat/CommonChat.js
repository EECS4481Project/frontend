// Common chat functionality shared between user & agent chat
import {
  Box, Button, Card, Input, Tooltip, Typography,
} from '@mui/joy';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import SendIcon from '@mui/icons-material/Send';
import { getSignedInAgentAuthToken } from '../agent/utils';

ChatScreen.propTypes = {
  isAgent: PropTypes.bool,
  sendMessage: PropTypes.func,
  chat: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.string,
    timestamp: PropTypes.number,
    correspondentUsername: PropTypes.string,
    isFromUser: PropTypes.bool,
  })),
};

export function ChatScreen({ chat, isAgent, sendMessage }) {
  const [text, setText] = useState('');

  let correspondentUsername = null;
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
          {chat && chat.map((msg, i) => {
            // Handle styling (if message is from or to the user)
            let isFrom = true;
            if (msg.isFromUser && !isAgent) {
              isFrom = false;
            } else if (!msg.isFromUser && isAgent) {
              isFrom = false;
            }
            // Check if agent username should be displayed
            let showUsername = false;
            if (msg.correspondentUsername !== correspondentUsername) {
              showUsername = true;
              correspondentUsername = msg.correspondentUsername;
            }
            return (
              <div key={i} style={{ width: '100%' }}>
                {showUsername
              && (
              <Typography color="neutral" textAlign="center" sx={{ width: '100%' }}>
                {isAgent ? `Agent: ${msg.correspondentUsername}`
                  : `Chatting with ${msg.correspondentUsername}`}
              </Typography>
              )}
                <Tooltip title={new Date(msg.timestamp).toLocaleString()}>
                  <Typography sx={{
                    width: 'fit-content',
                    float: isFrom ? 'left' : 'right',
                    backgroundColor: isFrom ? '#73738C' : '#3990FF',
                    borderRadius: '20px',
                    padding: '4px 8px 4px 8px',
                    margin: '2px 10px 2px 10px',
                    wordWrap: 'break-word',
                  }}
                  >
                    {msg.message}
                  </Typography>
                </Tooltip>
              </div>
            );
          })}
        </Box>
      </Box>
      { /* Chat input below */}
      <Card sx={{
        borderRadius: '0 0 0 0',
        display: 'flex',
        flexDirection: 'row',
        marginTop: '4px',
      }}
      >
        <Input
          size="sm"
          sx={{ flexGrow: 1, flexShrink: 1 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(event) => {
            if (event.key === 'Enter' && text !== '') {
              sendMessage(text);
              setText('');
            }
          }}
        />
        <Button
          size="sm"
          disabled={text === ''}
          sx={{ flexGrow: 0, flexShrink: 0, marginLeft: '10px' }}
          onSubmit={() => {
            setText(''); sendMessage(text);
          }}
        >
          <SendIcon />
        </Button>
      </Card>
    </Box>
  );
}

MessageScreen.propTypes = {
  message: PropTypes.string,
};

export function MessageScreen({ message }) {
  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      flexGrow: 1,
      flexShrink: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
    }}
    >
      <Typography>{message}</Typography>
    </Box>
  );
}

export const createSocket = () => io({
  path: '/api/start_chat',
  extraHeaders: { authorization: getSignedInAgentAuthToken() },
});
