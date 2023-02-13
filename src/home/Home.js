import { Link } from 'react-router-dom';
import './Home.css';

const SOME_VAR = "Home Page";

function Home() {
  return (
    <div>
      <h1>{SOME_VAR}</h1>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/login">Login</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/chat">Chat</Link></li>
        <li><Link to="/queue">Queue</Link></li>
      </ul>
    </div>
  );
}

export default Home;