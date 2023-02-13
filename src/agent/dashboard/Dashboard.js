import './Dashboard.css';
import { Link, Outlet } from 'react-router-dom';

function Dashboard() {
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