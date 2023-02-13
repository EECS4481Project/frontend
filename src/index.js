import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';

import Home from "./home/Home";
import Login from "./agent/login/Login";
import Dashboard from "./agent/dashboard/Dashboard";
import Chat from "./chat/Chat";
import Queue from "./queue/Queue";
import MessagingDashboard from "./agent/dashboard/messages/MessagingDashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home/>,
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    children: [
      {
        path: "chat",
        element: <Chat/>,
      },
      {
        path: "messages",
        element: <MessagingDashboard />
      },
    ]
  },
  {
    path: "/queue",
    element: <Queue />
  },
  {
    path: "/chat",
    element: <Chat />
  },
  {
    path: "*", // Default route
    element: <Home/>,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
