// Chat for agents to anonymous users
import { Autocomplete, Badge, Button, Card, CircularProgress, Modal, ModalDialog, Tooltip, Typography } from "@mui/joy";
import { Box } from "@mui/system";
import { useEffect, useReducer, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createSocket, MessageScreen, ChatScreen } from "./CommonChat";
import ClearIcon from '@mui/icons-material/Clear';
import PeopleIcon from '@mui/icons-material/People';
import "./AgentChat.css";

function AgentChat(props) {
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const location = useLocation();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [onlineAgents, setOnlineAgents] = useState([]);
    const [gotOnlineAgents, setGotOnlineAgents] = useState(false);
    // Users are of the format {userId: str, firstName: str, lastName: str}
    // Only the userId should be used to communicate with the user
    const [assignedUsers, setAssignedUsers] = useState([]);
    const [chattingWith, setChattingWith] = useState(null); // Current user being messaged
    const [unreadMessages, setUnreadMessages] = useState({});
    const [chats, setChats] = useState({});
    // Chats format: -- sorted by timestamp
    // {
    //   username: [
    //     {
    // message: string,
    // timestamp: number,
    // correspondentUsername: string,
    // isFromUser: boolean
    //     }
    //   ]
    // }

    // Loading states
    // Flag for if the agent is online in the chat or not
    // Ie. so we know to display the chat, or a join chat button
    const [isAgentInChat, setIsAgentInChat] = useState(false);
    const [disconnected, setDisconnected] = useState(false);

    if (location.pathname === '/chat') {
        navigate('/dashboard');
    }

    // Initialize socket
    useEffect(() => {
        setSocket(createSocket());
    }, []);

    // Handle socket responses
    useEffect(() => {
        if (socket) {
            socket.on('connect', () => {
            });

            socket.on('disconnect', (msg) => {
                setDisconnected(true);
            });

            socket.on('started-agent-chat', () => {
                setIsAgentInChat(true);
            });

            socket.on('available_agents', (agents) => {
                setOnlineAgents(agents);
                setGotOnlineAgents(true);
            })

            // When the queue assigned a user to the agent
            // NOTE: They haven't joined the chat yet -- only finished the queue
            socket.on('assigned_user', (user) => {
                setAssignedUsers(assignedUsers => [...assignedUsers, user])
                // Create the chat between the agent and user
                setChats(chats => ({
                    ...chats,
                    userId: []
                }))
            })

            socket.on('transcript', msg => {
                console.log(msg);
                setChats(chats => {
                    if (chats.hasOwnProperty(msg.userId)) {
                        chats[msg.userId].push(...msg);
                        chats[msg.userId].sort((a, b) => a.timestamp < b.timestamp);
                    } else {
                        chats[msg.userId] = msg.transcript;
                    }
                    return chats;
                });
                forceUpdate();
            })

            socket.on('message', data => {
                const toStore = { ...data };
                toStore['correspondentUsername'] = props.username;
                setChats(chats => {
                    if (chats.hasOwnProperty(data.correspondentUsername)) {
                        chats[data.correspondentUsername].push(toStore)
                    } else {
                        chats[data.correspondentUsername] = [toStore]
                    }
                    return chats;
                });
                if (data.correspondentUsername !== chattingWith) {
                    setUnreadMessages(unreadMessages => {
                        if (unreadMessages.hasOwnProperty(data.correspondentUsername)) {
                            unreadMessages[data.correspondentUsername] += 1;
                        } else {
                            unreadMessages[data.correspondentUsername] = 1;
                        }
                        return unreadMessages;
                    })
                }
                // Required do to deep chat change
                forceUpdate();
            })

            // When the user leaves the chat
            socket.on('user_disconnect', (userId) => {
                // Remove user from chattingWith if needed
                setChattingWith(chattingWith => {
                    if (chattingWith === userId) {
                        return null;
                    }
                    return chattingWith;
                })
                // Remove user from assigned users
                setAssignedUsers(assignedUsers => assignedUsers.filter((user) => {
                    return user.userId !== userId;
                }))
                // Remove chat logs
                setChats(chats => {
                    delete chats[userId];
                    return chats;
                })
                // Remove unread messages
                setUnreadMessages(unreadMessages => {
                    delete unreadMessages[userId];
                    return unreadMessages;
                })
            })

            return (() => {
                socket.disconnect();
            })
        }
    }, [socket])

    const startAgentChat = () => {
        if (socket) {
            socket.emit('agent-login');
        }
    }

    const sendMessage = (message) => {
        socket.emit('message', {
            userId: chattingWith,
            message: message
        });
        const messageData = {
            message: message,
            timestamp: Date.now(),
            correspondentUsername: props.username,
            isFromUser: false
        };
        setChats(chats => {
            if (chats.hasOwnProperty(chattingWith)) {
                chats[chattingWith].push(messageData)
            } else {
                chats[chattingWith] = [messageData]
            }
            return chats;
        })
        // Required do to deep chat change
        forceUpdate();
    }

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            {!isAgentInChat && !disconnected && <AgentJoinChat onClick={startAgentChat} />}
            {disconnected && <MessageScreen message="Something went wrong. Refresh the page" />}
            {isAgentInChat && !disconnected &&
                <div style={{ display: 'flex', width: '100%', height: '100%', flexDirection: 'row' }}>
                    <SideBar chattingWithUsers={assignedUsers} setChattingWithUsers={setAssignedUsers} socket={socket} chattingWith={chattingWith} setChattingWith={setChattingWith} unreadMessages={unreadMessages} gotOnlineAgents={gotOnlineAgents} onlineAgents={onlineAgents} />
                    {chattingWith && <ChatScreen chat={chats[chattingWith]} isAgent={true} sendMessage={sendMessage} />}
                    {!chattingWith && <MessageScreen message="Select a user to start chatting" />}
                </div>
            }
        </div>
    );
}

function SideBar(props) {
    const [isTransferAgentModalOpen, setIsTransferAgentModalOpen] = useState(false);
    const [userToTransfer, setUserToTransfer] = useState(null);
    const removeUserFromChattingWith = (userId) => {
        // Send request
        props.socket.emit('end-chat', { userId: userId });
    }
    return <Card sx={{ width: '280px', flexGrow: 0, flexShrink: 0, height: '100%', borderRadius: '0 0 0 0', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ overflow: 'auto' }}>
            {props.chattingWithUsers != null && props.chattingWithUsers.map((user => {
                return <Box key={user.userId} sx={{ display: 'flex', flexDirection: 'row' }}>
                    <Button variant={props.chattingWith === user.userId ? 'solid' : 'plain'} color='neutral' sx={{ justifyContent: 'flex-start', width: '100%' }}
                        onClick={(e) => { props.setChattingWith(user.userId) }}
                        endDecorator={
                            props.unreadMessages.hasOwnProperty(user.userId) &&
                            <Badge sx={{ marginLeft: '10px' }} badgeContent={props.unreadMessages[user.userId]}></Badge>
                        }
                    >
                        {user.firstName + " " + user.lastName}
                    </Button>
                    <Tooltip title="End Chat">
                        <Button color='danger' variant='plain' size='sm' sx={{ marginLeft: '5px', marginRight: '5px' }} onClick={() => removeUserFromChattingWith(user.userId)}><ClearIcon /></Button>
                    </Tooltip>
                    <Tooltip title="Transfer to Agent">
                        <Button color='warning' variant='plain' size='sm' onClick={() => {
                            setUserToTransfer(user);
                            setIsTransferAgentModalOpen(true);
                        }}><PeopleIcon /></Button>
                    </Tooltip>
                </Box>
            }))}
            <Modal open={isTransferAgentModalOpen} onClose={() => setIsTransferAgentModalOpen(false)}>
                <TransferToAgentModal setOpen={setIsTransferAgentModalOpen} user={userToTransfer} gotOnlineAgents={props.gotOnlineAgents} onlineAgents={props.onlineAgents} socket={props.socket} />
            </Modal>
        </Box>

    </Card>
}

function TransferToAgentModal(props) {
    const [transferTo, setTransferTo] = useState(null);

    const transferUser = (userId, toAgent) => {
        props.socket.emit('transfer', {
            userId: userId,
            toUsername: toAgent
        })
        props.setOpen(false);
    }

    return (<ModalDialog sx={{ maxWidth: 500 }}>
        <Typography component="h2" sx={{marginBottom: '5px'}}>
            Transfer {props.user.firstName + ' ' + props.user.lastName} to Another Agent
        </Typography>
        {!props.gotOnlineAgents && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></div>}
        {props.gotOnlineAgents && props.onlineAgents.length === 0 && <Typography>No other agents online</Typography>}
        {props.gotOnlineAgents && props.onlineAgents.length > 0 &&
        <div>
            <Autocomplete options={props.onlineAgents} sx={{marginBottom: '5px'}} value={transferTo} onChange={(e, val) => setTransferTo(val)} />
            <Button fullWidth disabled={transferTo === null} onClick={() => transferUser(props.user.userId, transferTo)}>Transfer</Button>
        </div>
        }
    </ModalDialog>);
}

function AgentJoinChat(props) {
    return <Box sx={{ width: '100%', height: '100%', flexGrow: 1, flexShrink: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <Typography>Not current in chat queue.</Typography>
        <Button onClick={props.onClick}>Join Chat</Button>
    </Box>;
}

export default AgentChat;