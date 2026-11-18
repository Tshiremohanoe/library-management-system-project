import { useState } from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Link
} from 'react-router-dom';

import { User } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import BookManagement from './pages/BookManagement';
import Transactions from './pages/Transactions';
import UserManagement from './pages/UserManagement';

import './App.css';

export default function App() {

  // RESTORE LOGIN SESSION AFTER REFRESH
  const [currentUser, setCurrentUserState] = useState(() => {
    try {
      const savedUser = localStorage.getItem('libraryUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('libraryUser');
      return null;
    }
  });

  const [token, setTokenState] = useState(() => {
    return localStorage.getItem('libraryToken') || null;
  });

  // SAVE USER INFORMATION
  const setCurrentUser = (user) => {
    setCurrentUserState(user);

    if (user) {
      localStorage.setItem('libraryUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('libraryUser');
    }
  };

  // SAVE LOGIN TOKEN
  const setToken = (newToken) => {
    setTokenState(newToken);

    if (newToken) {
      localStorage.setItem('libraryToken', newToken);
    } else {
      localStorage.removeItem('libraryToken');
    }
  };

  // LOGOUT
  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);

    localStorage.removeItem('libraryUser');
    localStorage.removeItem('libraryToken');
  };

  return (
    <Router>

      <header className="navbar">

        <div className="nav-left">

          <Link to="/" className="brand-badge">
            LIBRARY
          </Link>

          <nav className="nav-links">

            <NavLink to="/" end>
              Dashboard
            </NavLink>

            <NavLink to="/books">
              Books
            </NavLink>

            <NavLink to="/transactions">
              Transactions
            </NavLink>

            <NavLink to="/users">
              Users
            </NavLink>

          </nav>

        </div>

        <div className="user-badge">

          <User size={18} />

          <span>
            {currentUser
              ? `${currentUser.full_name} (${currentUser.role})`
              : 'My Account (Guest)'}
          </span>

        </div>

      </header>

      <main className="container">

        <Routes>

          {/* DASHBOARD */}
          <Route
            path="/"
            element={
              <Dashboard
                currentUser={currentUser}
                token={token}
              />
            }
          />

          {/* BOOK MANAGEMENT */}
          <Route
            path="/books"
            element={
              <BookManagement
                currentUser={currentUser}
                token={token}
              />
            }
          />

          {/* TRANSACTIONS */}
          <Route
            path="/transactions"
            element={
              <Transactions
                currentUser={currentUser}
                token={token}
              />
            }
          />

          {/* USER MANAGEMENT */}
          <Route
            path="/users"
            element={
              <UserManagement
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                token={token}
                setToken={setToken}
                onLogout={handleLogout}
              />
            }
          />

        </Routes>

      </main>

    </Router>
  );
}