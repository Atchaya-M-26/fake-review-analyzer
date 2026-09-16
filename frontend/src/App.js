import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Analyzer from './pages/Analyzer';
import Results from './pages/Results';
import History from './pages/History';
import './App.css';

function AppShell() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/analyzer" element={<Analyzer />} />
        <Route path="/analyze" element={<Analyzer />} />
        <Route path="/dashboard" element={<History />} />
        <Route path="/results/:productId" element={<Results />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
