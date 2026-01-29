import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Chat from './pages/Chat';
import CMS from './pages/CMS';
import Login from './pages/Login';
import ContentFactory from './pages/ContentFactory';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="search" element={<Search />} />
          <Route path="chat" element={<Chat />} />
          <Route path="cms" element={<CMS />} />
          <Route path="content-factory" element={<ContentFactory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
