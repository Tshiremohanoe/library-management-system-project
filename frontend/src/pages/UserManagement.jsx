import { useEffect, useState } from 'react';
import UserForm from '../components/UserForm';

const API_URL = 'http://localhost:5000/api/users';

export default function UserManagement({
  currentUser,
  setCurrentUser,
  token,
  setToken,
  onLogout
}) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    full_name: '',
    membership_id: '',
    username: '',
    password: ''
  });

  const [showRegister, setShowRegister] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  // LOAD REGISTERED USERS
  const fetchUsers = async () => {
    if (!token || !isAdmin) return;

    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          onLogout();
          throw new Error('Your session has expired. Please log in again.');
        }

        throw new Error(data.message || 'Could not load users.');
      }

      setUsers(data);
      setError('');

    } catch (err) {
      setError(err.message);
    }
  };

  // FETCH USERS WHEN ADMIN LOGS IN
  useEffect(() => {
    if (isAdmin && token) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [token, currentUser]);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      setCurrentUser(data.user);
      setToken(data.token);

      setMessage(`Welcome, ${data.user.full_name}!`);

      setLoginData({
        username: '',
        password: ''
      });

    } catch (err) {
      setError(err.message);
    }
  };

  // REGISTER MEMBER
  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      setMessage(data.message);

      setRegisterData({
        full_name: '',
        membership_id: '',
        username: '',
        password: ''
      });

      setShowRegister(false);

    } catch (err) {
      setError(err.message);
    }
  };

  // ADD OR UPDATE USER
  const handleSaveUser = async (userData) => {
    setMessage('');
    setError('');

    try {
      const isEditing = Boolean(selectedUser);

      if (isEditing && selectedUser.is_super_admin) {
        throw new Error('The Super Admin account is protected.');
      }

      const url = isEditing
        ? `${API_URL}/${selectedUser.user_id}`
        : API_URL;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Could not save user.'
        );
      }

      setMessage(
        isEditing
          ? 'User updated successfully!'
          : 'User added successfully!'
      );

      setSelectedUser(null);

      await fetchUsers();

      // TELL USERFORM THAT SAVING SUCCEEDED
      return true;

    } catch (err) {
      setError(err.message);

      // TELL USERFORM THAT SAVING FAILED
      return false;
    }
  };

  // DELETE USER
  const handleDelete = async (id) => {
    const selectedUserToDelete = users.find(
      (user) => Number(user.user_id) === Number(id)
    );

    if (selectedUserToDelete?.is_super_admin) {
      setError('The Super Admin account cannot be deleted.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Could not delete user.'
        );
      }

      setMessage('User deleted successfully!');

      await fetchUsers();

    } catch (err) {
      setError(err.message);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    setSelectedUser(null);
    setUsers([]);

    onLogout();

    setMessage('You have logged out.');
    setError('');
  };

  return (
    <div>
      <h1 className="page-title">User Management</h1>

      {message && (
        <p className="success-message">{message}</p>
      )}

      {error && (
        <p className="error-message">{error}</p>
      )}

      <section className="form-section">

        {!currentUser ? (
          <>
            {!showRegister ? (
              <>
                <h2>User Login</h2>

                <form onSubmit={handleLogin} className="book-form">
                  <input
                    type="text"
                    placeholder="Username"
                    value={loginData.username}
                    onChange={(e) =>
                      setLoginData({
                        ...loginData,
                        username: e.target.value
                      })
                    }
                    required
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({
                        ...loginData,
                        password: e.target.value
                      })
                    }
                    required
                  />

                  <button type="submit">
                    Log In
                  </button>
                </form>

                <p>Don't have an account?</p>

                <button
                  type="button"
                  onClick={() => {
                    setShowRegister(true);
                    setMessage('');
                    setError('');
                  }}
                >
                  Create Account
                </button>
              </>
            ) : (
              <>
                <h2>Create Member Account</h2>

                <form onSubmit={handleRegister} className="book-form">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={registerData.full_name}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        full_name: e.target.value
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Membership ID"
                    value={registerData.membership_id}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        membership_id: e.target.value
                      })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Choose Username"
                    value={registerData.username}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        username: e.target.value
                      })
                    }
                    required
                  />

                  <input
                    type="password"
                    placeholder="Choose Password (minimum 8 characters)"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value
                      })
                    }
                    minLength={8}
                    required
                  />

                  <button type="submit">
                    Create Account
                  </button>
                </form>

                <p>Already have an account?</p>

                <button
                  type="button"
                  onClick={() => {
                    setShowRegister(false);
                    setMessage('');
                    setError('');
                  }}
                >
                  Back to Login
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <h2>Account Information</h2>

            <p>
              Logged in as <strong>{currentUser.full_name}</strong>
              {' '}({currentUser.role})

              {currentUser.is_super_admin && (
                <strong> — SUPER ADMIN</strong>
              )}
            </p>

            <button
              type="button"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </>
        )}

      </section>

      {!currentUser && !showRegister && (
        <p>
          Please log in or create a member account to access your account.
        </p>
      )}

      {currentUser && !isAdmin && (
        <p>
          You are logged in as a member. You do not have
          permission to manage registered users.
        </p>
      )}

      {isAdmin && (
        <>
          <UserForm
            selectedUser={selectedUser}
            onSave={handleSaveUser}
            onCancel={() => setSelectedUser(null)}
          />

          <section className="dashboard-section">
            <h2>Registered Users</h2>

            {users.length === 0 ? (
              <p>No users registered yet.</p>
            ) : (
              <div className="table-wrapper">
                <table className="book-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Membership ID</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user.user_id}>
                        <td>{user.full_name}</td>
                        <td>{user.membership_id}</td>
                        <td>{user.username}</td>

                        <td>
                          {user.role}

                          {user.is_super_admin && (
                            <strong> (SUPER ADMIN)</strong>
                          )}
                        </td>

                        <td>
                          {user.is_super_admin ? (
                            <strong>Protected Account</strong>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedUser(user)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(user.user_id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

    </div>
  );
}