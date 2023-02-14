import './Dashboard.css';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { getSignedInAgent } from '../utils';
import { useState } from 'react';

function Dashboard() {
  // Check if user is signed in
  const [agent, setAgent] = useState(getSignedInAgent());
  if (agent === null) {
    return <Navigate to="/login"/>;
  }
  return (
    <div>
      <h1>Dashboard</h1>
      <ul>
        <li><Link to="/dashboard/chat">Chat</Link></li>
        <li><Link to="/dashboard/messages">Messages</Link></li>
      </ul>
      <Outlet/>
    </div>
  );
}

export default Dashboard;