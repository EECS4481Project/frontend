import { Button, Card, CircularProgress, Divider, FormControl, FormLabel, Grid, Input, Typography } from '@mui/joy';
import axios from 'axios';
import { useState } from 'react';
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
        <Grid container spacing={2} paddingLeft={1} paddingRight={1} paddingTop={1} sx={{ flexGrow: 1 }}>
            <Grid xs={4}>
                <Card>
                    <NewAgentForm />
                </Card>
            </Grid>
            <Grid xs={4}>
                <Card>
                    <Typography level='h6'>Delete Agent</Typography>
                    <Typography color="neutral" fontSize='sm'>Remove an agents account.</Typography>
                </Card>
            </Grid>
            <Grid xs={4}>
                <Card>
                    <Typography level='h6'>Unregister Agent</Typography>
                    <Typography color="neutral" fontSize='sm'>Set an agent to "unregistered" and reset their password.</Typography>
                </Card>
            </Grid>
            <Grid xs={6}>
                <Card>
                    <Typography level='h6'>Registered Agents</Typography>
                    <Typography color="neutral" fontSize='sm'>All agents who have registered (ie. have signed into account).</Typography>
                </Card>
            </Grid>
            <Grid xs={6}>
                <Card>
                    <Typography level='h6'>Non-Registered Agents</Typography>
                    <Typography color="neutral">All agents who have not yet registered (ie. haven't signed into account).</Typography>
                </Card>
            </Grid>
        </Grid>
    );
}

function NewAgentForm() {
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");

    const registerUser = (username, firstName, lastName) => {
        setIsLoading(true);
        setErrMsg("");
        axios.post('/admin/register_temp_user', {
            username, firstName, lastName
        }).then(res => {
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
                    <Divider sx={{mt: '10px', mb: '10px'}}/>
                    {isLoading && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></div>}
                    {!isLoading && <form onSubmit={e => {e.preventDefault(); registerUser(username, firstName, lastName)}}>
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
                            <Input readonly type="text" placeholder="To be generated" value={password} style={{color: 'var(--joy-palette-neutral-200)'}}
                            endDecorator={
                                <Button color='neutral' onClick={() => navigator.clipboard.writeText(password)}>Copy</Button>
                            }
                            />
                        </FormControl>
                        {errMsg !== "" && <Typography color="danger" fontSize="sm" marginTop={1}>{errMsg}</Typography>}
                        <Button type='submit' sx={{ mt: 1, width: '100%'}}>Register</Button>
                    </form>}
        </div>
    );
}

export default AdminDashboard;