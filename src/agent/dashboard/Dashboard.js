import './Dashboard.css';
import { Link, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { checkPasswordRequirements, getSignedInAgent } from '../utils';
import { useEffect, useState } from 'react';
import { Stack } from '@mui/system';
import { Button, CircularProgress, Divider, FormControl, FormLabel, Input, MenuItem, MenuList, Modal, ModalDialog, Tab, TabList, Tabs, Typography } from '@mui/joy';
import { styled } from '@mui/joy/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import ClickAwayListener from '@mui/base/ClickAwayListener';
import PopperUnstyled from '@mui/base/PopperUnstyled';
import axios from 'axios';



function Dashboard() {
  // Check if user is signed in
  const navigate = useNavigate();
  const location = useLocation();
  console.log(location.pathname);
  const [agent, setAgent] = useState(getSignedInAgent());
  if (agent === null) {
    return <Navigate to="/login" />;
  } else if (location.pathname === '/dashboard') {
    return <Navigate to="/dashboard/chat" />;
  }
  return (
    <div>
      <Stack direction="row" paddingLeft={4} paddingRight={4} paddingTop={1} paddingBottom={1} width='100%' sx={{ backgroundColor: 'background.level1', boxShadow: 'xs' }}>
        <Typography level="h3">Dashboard</Typography>
        <Divider orientation='vertical' sx={{ ml: 3 }} />
        <Stack direction="row" justifyContent="center" display="flex" width="100%" sx={{ ml: 3, mr: 3 }}>
          <Button color={location.pathname === "/dashboard/chat" ? "primary" : "neutral"} onClick={() => { navigate('/dashboard/chat') }} variant="plain" size="sm" sx={{ mr: 1 }}>Chat</Button>
          <Button color={location.pathname === "/dashboard/messages" ? "primary" : "neutral"} onClick={() => { navigate('/dashboard/messages') }} size="sm" variant="plain">Messages</Button>
        </Stack>

        <Typography sx={{ mt: '7px' /* hacky way to center it */ }}>{agent.username}</Typography>
        <ProfileMenu />
      </Stack>
      <Outlet />
    </div>
  );
}

function ProfileMenu() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    axios.post('/logout').then(res => {
      navigate('/login');
    }).catch(err => {
      navigate('/login');
    });
  }

  const handleChangePassword = () => {
    handleClose();
    setIsChangePasswordOpen(true);
  }

  const handleListKeyDown = (event) => {
    if (event.key === 'Tab') {
      setAnchorEl(null);
    } else if (event.key === 'Escape') {
      anchorEl.focus();
      setAnchorEl(null);
    }
  };

  const Popup = styled(PopperUnstyled)({
    zIndex: 1000,
  });


  return (
    <div>
      <Button
        id="composition-button"
        aria-controls={open ? 'composition-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="plain"
        color="neutral"
        onClick={handleClick}>
        <MoreVertIcon />
      </Button>
      <Popup
        role={undefined}
        id="composition-menu"
        open={open}
        anchorEl={anchorEl}
        disablePortal
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 4],
            },
          },
        ]}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <MenuList
            variant="outlined"
            onKeyDown={handleListKeyDown}
            sx={{ boxShadow: 'md', bgcolor: 'background.body' }}
          >
            <MenuItem onClick={handleChangePassword}>Change Password</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </MenuList>
        </ClickAwayListener>
      </Popup>

      <Modal open={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)}>
        <ChangePasswordModal setOpen={setIsChangePasswordOpen} />
      </Modal>
    </div>
  );
}

function ChangePasswordModal(props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmedNewPassword, setConfirmedNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordReqs, setPasswordReqs] = useState(checkPasswordRequirements(newPassword));
  const [errMsg, setErrMsg] = useState("");

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

  const changePassword = (newPassword, confirmedNewPassword) => {
    if (newPassword !== confirmedNewPassword) {
      setErrMsg("New passwords don't match.");
      setIsLoading(false);
      return;
    }
    axios.post('/auth/change_password', {password: newPassword}).then(res => {
      setIsLoading(false);
      props.setOpen(false);
    }).catch(err => {
      setErrMsg("Something went wrong. Try again later.");
      setIsLoading(false);
    })
  }



  return (
    <ModalDialog
      aria-labelledby="basic-modal-dialog-title"
      aria-describedby="basic-modal-dialog-description"
      sx={{ maxWidth: 500 }}
    >
      <Typography id="basic-modal-dialog-title" component="h2">
        Change Password
      </Typography>
      {isLoading && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></div>}
      {!isLoading &&
      <form
        onSubmit={(event) => {
          event.preventDefault();
          changePassword(newPassword, confirmedNewPassword);
        }}
      >
        <Stack>
          <FormControl>
            <FormLabel>New Password</FormLabel>
            <Input autoFocus required type="password" placeholder="Password" onChange={e => setNewPassword(e.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel>Confirm New Password</FormLabel>
            <Input required type="password" placeholder="Password" onChange={e => setConfirmedNewPassword(e.target.value)} />
          </FormControl>
          <Typography textColor="neutral" fontSize="sm">Password Requirements:</Typography>
          {passwordReqs.requirements.map((name) => <Typography color={passwordReqs[name]["met"] ? "neutral:500" : "neutral"} fontSize="sm">- {passwordReqs[name]["text"]}</Typography>)}
          {errMsg !== "" && <Typography color="danger" fontSize="sm" marginTop={1}>{errMsg}</Typography>}
          <FormControl>
            {!passwordReqsMet && <Button disabled sx={{ mt: 1 }}>Change Password</Button>}
            {passwordReqsMet && <Button type='submit' sx={{ mt: 1 }}>Change Password</Button>}
          </FormControl>
        </Stack>
      </form>}
    </ModalDialog>
  )
}

export default Dashboard;