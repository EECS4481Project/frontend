import { Button, Card, CircularProgress, Divider, FormControl, FormLabel, Grid, Input, List, ListItem, Sheet, Typography } from '@mui/joy';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSignedInAgent } from '../../utils';

function AdminDashboard() {
    const [agent, setAgent] = useState(getSignedInAgent());

    if (agent === null) {
        return <Navigate to="/login" />;
    } else if (!agent.isAdmin) {
        return <Navigate to="/dashboard" />;
    }
    return (
        <Grid container alignItems="stretch" spacing={2} paddingLeft={1} paddingRight={1} paddingTop={1}>
            <Grid item xs={4} style={{display: 'flex'}}>
                <Card style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'column', width: '100%'}}>
                    <NewAgentForm />
                </Card>
            </Grid>
            <Grid item xs={4} style={{display: 'flex'}}>
                <Card style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'column', width: '100%'}}>
                    <DeleteAgentForm />
                </Card>
            </Grid>
            <Grid xs={4} style={{display: 'flex'}}>
                <Card style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'column', width: '100%'}}>
                    <UnregisterAgentForm />
                </Card>
            </Grid>
            <Grid xs={6}>
                <Card>
                    <AgentList endpoint='/api/admin/all_registered_users' title='Registered Agents'
                    desc='All agents who have registered (ie. have signed into account).' />
                </Card>
            </Grid>
            <Grid xs={6}>
                <Card>
                    <AgentList endpoint='/api/admin/all_nonregistered_users' title='Non-Registered Agents'
                    desc="All agents who have not yet registered (ie. haven't signed into account)." />
                </Card>
            </Grid>
        </Grid>
    );
}

function AgentList(props) {
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [errMsg, setErrMsg] = useState("");

    const getUsers = () => {
        setIsLoading(true);
        setErrMsg("");
        axios.get(props.endpoint).then(res => {
            setUsers(res.data);
            console.log(users);
        }).catch(err => {
            setErrMsg("Failed to load agents. Try again later.");
        }).finally(() => {
            setIsLoading(false);
        })
    }

    useEffect(() => {
        getUsers();
    }, []);

    return <div>
        <Typography level='h6'>{props.title}</Typography>
        <Typography color="neutral" fontSize='sm'>{props.desc}</Typography>
        <Divider sx={{ mt: '10px', mb: '10px' }} />
        {isLoading && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></div>}
        {!isLoading && <div>
            <Button fullWidth onClick={getUsers}>Refresh</Button>
            <Sheet variant="soft" sx={{height: '170px', mt: 1, overflow: 'auto', borderRadius: 4}}>
            <List>
                {users.map((value, index) => (
                    <ListItem key={index}>
                        {value.username + " - " + value.firstName + " " + value.lastName}
                    </ListItem>
                ))}
            </List>
            </Sheet>
            {errMsg !== "" && <Typography color="danger" fontSize="sm" marginTop={1}>{errMsg}</Typography>}
        </div>
        }
    </div>;
}

function UnregisterAgentForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const unregisterUser = (username) => {
        setIsLoading(true);
        setErrMsg("");
        setSuccessMsg("");
        setPassword("");
        axios.post('/api/admin/unregister_user', {
            username
        }).then(res => {
            setPassword(res.data.password);
            setSuccessMsg("Unregistered " + username);
        }).catch(err => {
            if (err.response.status === 404) {
                setErrMsg("Username not found");
            } else {
                setErrMsg("Something went wrong. Try again later.");
            }
        }).finally(() => {
            setIsLoading(false);
        })
    }

    return <div>
        <Typography level='h6'>Unregister Agent</Typography>
        <Typography color="neutral" fontSize='sm'>Set an agent to "unregistered" and reset their password.</Typography>
        <Divider sx={{ mt: '10px', mb: '10px' }} />
        {isLoading && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></div>}
        {!isLoading && <form onSubmit={e => { e.preventDefault(); unregisterUser(username) }}>
            <FormControl>
                <FormLabel>Username</FormLabel>
                <Input required type="username" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            </FormControl>
            <FormControl>
                <FormLabel>Password</FormLabel>
                <Input readonly type="text" placeholder="To be generated" value={password} style={{ color: 'var(--joy-palette-neutral-200)' }}
                    endDecorator={
                        <Button color='neutral' onClick={() => navigator.clipboard.writeText(password)}>Copy</Button>
                    }
                />
            </FormControl>
            {errMsg !== "" && <Typography color="danger" fontSize="sm" marginTop={1}>{errMsg}</Typography>}
            {successMsg !== "" && <Typography color="success" fontSize="sm" marginTop={1}>{successMsg}</Typography>}
            <Button type='submit' sx={{ mt: 1, width: '100%' }}>Unregister Agent</Button>
        </form>}
    </div>
}

function DeleteAgentForm() {
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const deleteUser = (username) => {
        setIsLoading(true);
        setErrMsg("");
        setSuccessMsg("");
        axios.post('/api/admin/delete_user', {
            username
        }).then(res => {
            setSuccessMsg("Deleted " + username);
        }).catch(err => {
            if (err.response.status === 404) {
                setErrMsg("Username not found");
            } else {
                setErrMsg("Something went wrong. Try again later.");
            }
        }).finally(() => {
            setIsLoading(false);
        })
    }

    return <div>
        <Typography level='h6'>Delete Agent</Typography>
        <Typography color="neutral" fontSize='sm'>Remove an agents account.<br />You can also remove admin accounts.</Typography>
        <Divider sx={{ mt: '10px', mb: '10px' }} />
        {isLoading && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></div>}
        {!isLoading && <form onSubmit={e => { e.preventDefault(); deleteUser(username) }}>
            <FormControl>
                <FormLabel>Username</FormLabel>
                <Input required type="username" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            </FormControl>
            {errMsg !== "" && <Typography color="danger" fontSize="sm" marginTop={1}>{errMsg}</Typography>}
            {successMsg !== "" && <Typography color="success" fontSize="sm" marginTop={1}>{successMsg}</Typography>}
            <Button type='submit' sx={{ mt: 1, width: '100%' }}>Delete Agent</Button>
        </form>}
    </div>
}

function NewAgentForm() {
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const registerUser = (username, firstName, lastName) => {
        setIsLoading(true);
        setSuccessMsg("");
        setErrMsg("");
        setPassword("");
        axios.post('/api/admin/register_temp_user', {
            username, firstName, lastName
        }).then(res => {
            setSuccessMsg("Registered " + username);
            setPassword(res.data.password);
        }).catch(err => {
            if (err.response.status === 409) {
                setErrMsg("Username already exists");
            } else {
                setErrMsg("Something went wrong. Try again later.");
            }
        }).finally(() => {
            setIsLoading(false);
        })
    }

    return (
        <div>
            <Typography level='h6'>Create Agent</Typography>
            <Typography color="neutral" fontSize='sm'>Create a new agent with a random password.
                They will then set their own password during registration</Typography>
            <Divider sx={{ mt: '10px', mb: '10px' }} />
            {isLoading && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></div>}
            {!isLoading && <form onSubmit={e => { e.preventDefault(); registerUser(username, firstName, lastName) }}>
                <FormControl>
                    <FormLabel>Username</FormLabel>
                    <Input required type="username" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                </FormControl>
                <FormControl>
                    <FormLabel>First Name</FormLabel>
                    <Input required type="text" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </FormControl>
                <FormControl>
                    <FormLabel>Last Name</FormLabel>
                    <Input required type="text" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} />
                </FormControl>
                <FormControl>
                    <FormLabel>Password</FormLabel>
                    <Input readonly type="text" placeholder="To be generated" value={password} style={{ color: 'var(--joy-palette-neutral-200)' }}
                        endDecorator={
                            <Button color='neutral' onClick={() => navigator.clipboard.writeText(password)}>Copy</Button>
                        }
                    />
                </FormControl>
                {errMsg !== "" && <Typography color="danger" fontSize="sm" marginTop={1}>{errMsg}</Typography>}
                {successMsg !== "" && <Typography color="success" fontSize="sm" marginTop={1}>{successMsg}</Typography>}
                <Button type='submit' sx={{ mt: 1, width: '100%' }}>Register</Button>
            </form>}
        </div>
    );
}

export default AdminDashboard;