import './Login.css';
import axios from 'axios';
import Grid from '@mui/joy/Grid';
import { Button, Card, CircularProgress, FormControl, FormLabel, Input, Tab, TabList, TabPanel, Tabs, Typography } from '@mui/joy';
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { checkPasswordRequirements } from '../utils';


function Login() {
  return (
    <Grid container spacing={0} direction="column" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Grid item>
        <Card variant="outlined" sx={{ width: 320 }}>
          <Tabs aria-label="Basic tabs" defaultValue={0} sx={{ borderRadius: 'lg' }}>
            <TabList>
              <Tab>Login</Tab>
              <Tab>Register</Tab>
            </TabList>
            <TabPanel value={0} sx={{ p: 2 }}>
              <LoginForm />
            </TabPanel>
            <TabPanel value={1} sx={{ p: 2 }}>
              <RegisterForm />
            </TabPanel>
          </Tabs>
        </Card>
      </Grid>
    </Grid>
  );
}

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  let navigate = useNavigate();

  const login = (username, password) => {
    setIsLoading(true);
    if (username === '' || password === '') {
      setErrMsg("Username & Password can't be blank.");
      setIsLoading(false);
      return;
    }
    axios.post('/api/auth/login', {
      username, password
    }).then((res) => {
      navigate("/dashboard");
    }).catch((err) => {
      if (err.response.status === 400) {
        setErrMsg("Invalid Credentials");
      } else if (err.response.status === 409) {
        setErrMsg("You have to register this account.");
      } else if (err.response.status === 429) {
        setErrMsg("Too many attempts. Try again later");
      } else {
        setErrMsg("Something went wrong. Try again.");
      }
      setIsLoading(false);
    })
  }

  return (
    <div style={{ minHeight: 180 }}>
      {isLoading && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></div>}
      {!isLoading && <div><form onSubmit={(e) => { e.preventDefault(); login(username, password) }}>
        <FormControl required>
          <FormLabel>Username</FormLabel>
          <Input
            name="username"
            type="username"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormControl>
        <FormControl required>
          <FormLabel>Password</FormLabel>
          <Input
            name="password"
            type="password"
            required
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>
        {errMsg !== "" && <Typography color="danger" fontSize="sm" marginTop={1}>{errMsg}</Typography>}
        <Button sx={{ mt: 1, width: '100%' }} type="submit">Log in</Button>
      </form>
      </div>}
    </div>
  )
}

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedNewPassword, setConfirmedNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  let navigate = useNavigate();

  const [passwordReqs, setPasswordReqs] = useState(checkPasswordRequirements(newPassword));

  const [passwordReqsMet, setPasswordReqsMet] = useState(false);

  // Check new password validity
  useEffect(() => {
    // Update requirements
    const tempPasswordReqs = checkPasswordRequirements(newPassword)
    let tempPasswordReqsMet = true;
    for (var i = 0; i < tempPasswordReqs.requirements.length; i++) {
      if (!tempPasswordReqs[tempPasswordReqs.requirements[i]].met) {
        tempPasswordReqsMet = false;
        break;
      }
    }
    setPasswordReqs(tempPasswordReqs);
    setPasswordReqsMet(tempPasswordReqsMet);
  }, [newPassword])


  const register = (username, password, newPassword, confirmedNewPassword) => {
    setIsLoading(true);
    if (username === '' || password === '') {
      setErrMsg("Username & Password can't be blank.");
      setIsLoading(false);
      return;
    } else if (newPassword !== confirmedNewPassword) {
      setErrMsg("New passwords don't match.");
      setIsLoading(false);
      return;
    } else if (newPassword === password) {
      setErrMsg("Your new password must differ from your current password.");
      setIsLoading(false);
      return;
    }
    axios.post('/api/auth/register', {
      username, password, newPassword
    }).then((res) => {
      navigate("/dashboard");
    }).catch((err) => {
      if (err.response.status === 400) {
        setErrMsg("Invalid Credentials");
      } else if (err.response.status === 429) {
        setErrMsg("Too many attempts. Try again later");
      } else {
        setErrMsg("Something went wrong. Try again.");
      }
      setIsLoading(false);
    })
  }

  return (
    <div style={{ minHeight: 180 }}>
      {isLoading && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></div>}
      {!isLoading && <div><form onSubmit={(e) => { e.preventDefault(); register(username, password, newPassword, confirmedNewPassword) }}>
        <FormControl required>
          <FormLabel>Username</FormLabel>
          <Input
            name="username"
            type="username"
            required
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormControl>
        <FormControl required>
          <FormLabel>Password</FormLabel>
          <Input
            name="password"
            type="password"
            required
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>
        <FormControl required>
          <FormLabel>New Password</FormLabel>
          <Input
            name="newPassword"
            type="password"
            required
            placeholder="New Password"
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </FormControl>
        <FormControl required>
          <FormLabel>Confirm New Password</FormLabel>
          <Input
            name="newPassword"
            type="password"
            required
            placeholder="New Password"
            onChange={(e) => setConfirmedNewPassword(e.target.value)}
          />
        </FormControl>
        <Typography textColor="neutral" fontSize="sm">Password Requirements:</Typography>
        {passwordReqs.requirements.map((name) => <Typography color={passwordReqs[name]["met"] ? "neutral:500" : "neutral"} fontSize="sm">- {passwordReqs[name]["text"]}</Typography>)}

        {errMsg !== "" && <Typography color="danger" fontSize="sm" marginTop={1}>{errMsg}</Typography>}
        {!passwordReqsMet && <Button disabled sx={{ mt: 1, width: '100%' }}>Register</Button>}
        {passwordReqsMet && <Button type='submit' sx={{ mt: 1, width: '100%' }}>Register</Button>}
      </form>
      </div>}
    </div>
  )
}

export default Login;