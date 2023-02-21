// Entry point component for user -> agent chat (for use by both users & agents)
import { useState } from 'react';
import { getSignedInAgent } from '../agent/utils';
import AgentChat from './AgentChat';
import UserChat from './UserChat';

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

export default Chat;