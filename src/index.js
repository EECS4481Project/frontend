import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import {
  CircularProgress, CssBaseline, CssVarsProvider, Box, Typography,
} from '@mui/joy';
import { ToastContainer } from 'react-toastify';
import reportWebVitals from './reportWebVitals';
import 'react-toastify/dist/ReactToastify.css';

import Home from './home/Home';
import Chat from './chat/Chat';
import Queue from './queue/Queue';

// Lazy load admin/agent related routes
const Login = React.lazy(() => import('./agent/login/Login'));
const Dashboard = React.lazy(() => import('./agent/dashboard/Dashboard'));
const AdminDashboard = React.lazy(() => import('./agent/dashboard/admin/AdminDashboard'));
const MessagingDashboard = React.lazy(() => import('./agent/dashboard/messages/MessagingDashboard'));

const LOADING = (
  <CssVarsProvider defaultMode="system">
    <CssBaseline />
    <Box sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}
    >
      <CircularProgress />
      <Typography level="h3">Loading...</Typography>
    </Box>
  </CssVarsProvider>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Suspense fallback={LOADING}><Login /></Suspense>,
  },
  {
    path: '/dashboard',
    element: <Suspense fallback={LOADING}><Dashboard /></Suspense>,
    children: [
      {
        path: 'chat',
        element: <Chat />,
      },
      {
        path: 'messages',
        element: <Suspense fallback={LOADING}><MessagingDashboard /></Suspense>,
      },
      {
        path: 'admin',
        element: <Suspense fallback={LOADING}><AdminDashboard /></Suspense>,
      },
    ],
  },
  {
    path: '/queue',
    element: <Queue />,
  },
  {
    path: '/chat',
    element: <Chat />,
  },
  {
    path: '*', // Default route
    element: <Home />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <CssVarsProvider defaultMode="system">
    <CssBaseline />
    <RouterProvider router={router} />
    <ToastContainer />
  </CssVarsProvider>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
