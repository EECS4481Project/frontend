import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, CssVarsProvider } from '@mui/joy';
import { ToastContainer } from 'react-toastify';
import reportWebVitals from './reportWebVitals';
import 'react-toastify/dist/ReactToastify.css';

import Home from './home/Home';
import Login from './agent/login/Login';
import Dashboard from './agent/dashboard/Dashboard';
import Chat from './chat/Chat';
import Queue from './queue/Queue';
import MessagingDashboard from './agent/dashboard/messages/MessagingDashboard';
import AdminDashboard from './agent/dashboard/admin/AdminDashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
    children: [
      {
        path: 'chat',
        element: <Chat />,
      },
      {
        path: 'messages',
        element: <MessagingDashboard />,
      },
      {
        path: 'admin',
        element: <AdminDashboard />,
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
