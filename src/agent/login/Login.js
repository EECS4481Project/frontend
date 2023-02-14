import './Login.css';
import axios from 'axios';
import Grid from '@mui/joy/Grid';
import { Button, Card, CircularProgress, FormControl, FormLabel, Input, Tab, TabList, TabPanel, Tabs, Typography } from '@mui/joy';
import { useEffect, useState } from 'react';
import { Form, useNavigate } from "react-router-dom";


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
    axios.post('/auth/login', {
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
      {!isLoading && <div><Form onSubmit={(e) => {e.preventDefault(); login(username, password)}}>
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
      </Form>
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
  const passwordRequirementOrder = [
    "lowercase", "uppercase", "number", "symbol", "length"
  ];
  const [passwordReqs, setPasswordReqs] = useState({
    "lowercase": { met: false, text: "At least 1 lowercase letter." },
    "uppercase": { met: false, text: "At least 1 uppercase letter." },
    "number": { met: false, text: "At least 1 number." },
    "symbol": { met: false, text: "At least 1 symbol." },
    "length": { met: false, text: "At least 8 characters." },
  });
  let navigate = useNavigate();

  const [passwordReqsMet, setPasswordReqsMet] = useState(false);

  // Check new password validity
  useEffect(() => {
    let lowercaseCount = 0;
    let uppercaseCount = 0;
    let numberCount = 0;
    let symbolCount = 0;
    for (var i = 0; i < newPassword.length; i++) {
      if (newPassword.charCodeAt(i) >= 'a'.charCodeAt(0)
        && newPassword.charCodeAt(i) <= 'z'.charCodeAt(0)) {
        lowercaseCount += 1;
      } else if (newPassword.charCodeAt(i) >= 'A'.charCodeAt(0)
        && newPassword.charCodeAt(i) <= 'Z'.charCodeAt(0)) {
        uppercaseCount += 1;
      } else if (newPassword.charCodeAt(i) >= '0'.charCodeAt(0)
        && newPassword.charCodeAt(i) <= '9'.charCodeAt(0)) {
        numberCount += 1;
      } else {
        symbolCount += 1;
      }
    }
    // Update requirements
    setPasswordReqs({
      "lowercase": { met: lowercaseCount >= 1, text: "At least 1 lowercase letter." },
      "uppercase": { met: uppercaseCount >= 1, text: "At least 1 uppercase letter." },
      "number": { met: numberCount >= 1, text: "At least 1 number." },
      "symbol": { met: symbolCount >= 1, text: "At least 1 symbol." },
      "length": { met: newPassword.length >= 8, text: "At least 8 characters." },
    });
    setPasswordReqsMet(lowercaseCount >= 1 && uppercaseCount >= 1 && numberCount >= 1
      && symbolCount >= 1 && newPassword.length >= 8);
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
    }
    axios.post('/auth/register', {
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
      {!isLoading && <div><Form onSubmit={(e) => {e.preventDefault(); register(username, password, newPassword, confirmedNewPassword)}}>
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
        {passwordRequirementOrder.map((name) => <Typography color={passwordReqs[name]["met"] ? "neutral:500" : "neutral"} fontSize="sm">- {passwordReqs[name]["text"]}</Typography>)}

        {errMsg !== "" && <Typography color="danger" fontSize="sm" marginTop={1}>{errMsg}</Typography>}
        {!passwordReqsMet && <Button disabled sx={{ mt: 1, width: '100%' }}>Register</Button>}
        {passwordReqsMet && <Button type='submit' sx={{ mt: 1, width: '100%' }}>Register</Button>}
      </Form>
      </div>}
    </div>
  )
}

export default Login;