import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import EditCompany from './pages/EditCompany';
import ContactList from './pages/ContactList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/edit" element={<EditCompany />} />
        <Route path="/contacts" element={<ContactList />} />
      </Routes>
    </Router>
  );
}

export default App;