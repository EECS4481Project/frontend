import { Button, Card, CircularProgress, Divider, FormControl, FormLabel, Grid, Input, List, ListItem, Sheet, Table, Typography } from '@mui/joy';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSignedInAgent } from '../../utils';
import ShieldIcon from '@mui/icons-material/Shield';
import { authorizedAxios } from '../../../auth/RequestInterceptor';

function AdminDashboard() {
    const [agent, setAgent] = useState(getSignedInAgent());

    const gridItemStyle = { display: 'flex' };
    const cardItemStyle = { display: 'flex', justifyContent: 'space-between', flexDirection: 'column', width: '100%' };

    if (agent === null) {
        return <Navigate to="/login" />;
    } else if (!agent.isAdmin) {
        return <Navigate to="/dashboard" />;
    }
    return (
        <Grid container alignItems="stretch" spacing={2} paddingLeft={1} paddingRight={1} paddingTop={1} margin={0}>
            <Grid item xs={4} style={gridItemStyle}>
                <Card style={cardItemStyle}>
                    <NewAgentForm />
                </Card>
            </Grid>
            <Grid item xs={4} style={gridItemStyle}>
                <Card style={cardItemStyle}>
                    <DeleteAgentForm />
                </Card>
            </Grid>
            <Grid xs={4} style={gridItemStyle}>
                <Card style={cardItemStyle}>
                    <UnregisterAgentForm />
                </Card>
            </Grid>
            <Grid xs={4} style={gridItemStyle}>
                <Card style={cardItemStyle}>
                    <AgentList endpoint='/api/admin/all_registered_users' title='Registered Agents'
                        desc='All agents who have registered (ie. have signed into account).' />
                </Card>
            </Grid>
            <Grid xs={4} style={gridItemStyle}>
                <Card style={cardItemStyle}>
                    <AgentList endpoint='/api/admin/all_nonregistered_users' title='Non-Registered Agents'
                        desc="All agents who have not yet registered (ie. haven't signed into account)." />
                </Card>
            </Grid>
            <Grid xs={4} style={gridItemStyle}>
                <Card style={cardItemStyle}>
                    <AgentList endpoint='/api/admin/all_deleted_users' title='Deleted Agents'
                        desc="All agents who have been deleted." />
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
        authorizedAxios.get(props.endpoint).then(res => {
            setUsers(res.data);
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
            <Sheet variant="soft" sx={{ height: '170px', mt: 1, overflow: 'auto', borderRadius: 4 }}>
                <Table stickyHeader sx={{ '& thead th:nth-child(1)': { width: '90px' } }}>
                    <thead>
                        <tr>
                            <th>Is Admin?</th>
                            <th>Username</th>
                            <th>Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, i) => (
                            <tr key={i}>
                                <td style={{paddingLeft: '30px'}}>
                                    {user.isAdmin ? <ShieldIcon /> : ""}
                                </td>
                                <td>{user.username}</td>
                                <td>{user.firstName + " " + user.lastName}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
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
        authorizedAxios.post('/api/admin/unregister_user', {
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
                <Input readOnly type="text" placeholder="To be generated" value={password} style={{ color: 'var(--joy-palette-neutral-200)' }}
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
        authorizedAxios.post('/api/admin/delete_user', {
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
        <Typography color="neutral" fontSize='sm'>Delete an agent or admins account. This is currently irreversible.</Typography>
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
        authorizedAxios.post('/api/admin/register_temp_user', {
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
                    <Input readOnly type="text" placeholder="To be generated" value={password} style={{ color: 'var(--joy-palette-neutral-200)' }}
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