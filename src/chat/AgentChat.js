// Chat for agents to anonymous users
import { Badge, Button, Card, Typography } from "@mui/joy";
import { Box } from "@mui/system";
import { useEffect, useReducer, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createSocket, MessageScreen, ChatScreen } from "./CommonChat";
import ClearIcon from '@mui/icons-material/Clear';

function AgentChat(props) {
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const location = useLocation();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
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
                    <SideBar chattingWithUsers={assignedUsers} setChattingWithUsers={setAssignedUsers} socket={socket} chattingWith={chattingWith} setChattingWith={setChattingWith} unreadMessages={unreadMessages} />
                    {chattingWith && <ChatScreen chat={chats[chattingWith]} isAgent={true} sendMessage={sendMessage} />}
                    {!chattingWith && <MessageScreen message="Select a user to start chatting" />}
                </div>
            }
        </div>
    );
}

function SideBar(props) {
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
                    <Button color='danger' variant='plain' size='sm' onClick={() => removeUserFromChattingWith(user.userId)}><ClearIcon /></Button>
                </Box>
            }))}
        </Box>

    </Card>
}

function AgentJoinChat(props) {
    return <Box sx={{ width: '100%', height: '100%', flexGrow: 1, flexShrink: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <Typography>Not current in chat queue.</Typography>
        <Button onClick={props.onClick}>Join Chat</Button>
    </Box>;
}

export default AgentChat;