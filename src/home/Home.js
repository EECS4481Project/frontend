import axios from 'axios';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const SOME_VAR = "Home Page";

function Home() {
  const [valueFromEndpoint, setValueFromEndpoint] = useState("Loading...");
  axios.get('/api/health_check').then(res => {
    if (res.status === 200) {
      setValueFromEndpoint("Successfully reached backend w/ API call!");
    } else {
      setValueFromEndpoint("Failed to reach backend w/ API call :(");
    }
  })
  return (
    <div>
      <h1>{SOME_VAR}</h1>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/dashboard">Agent Dashboard</Link></li>
        <li><Link to="/chat">Chat</Link></li>
        <li><Link to="/queue">Queue</Link></li>
      </ul>
      <h2>{valueFromEndpoint}</h2>
    </div>
  );
}

export default Home;