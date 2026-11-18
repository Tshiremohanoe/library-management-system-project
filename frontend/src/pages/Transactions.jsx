import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/api';

export default function Transactions({ currentUser, token }) {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [formData, setFormData] = useState({
    book_id: '',
    user_id: '',
    transaction_type: 'borrow',
    quantity: '1'
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const isMember = currentUser?.role === 'member';

  // LOAD BOOKS, USERS AND TRANSACTIONS
  const fetchData = async () => {
    if (!token || !currentUser) {
      setBooks([]);
      setUsers([]);
      setTransactions([]);
      return;
    }

    setError('');

    try {
      const headers = {
        Authorization: `Bearer ${token}`
      };

      const requests = [
        fetch(`${API_URL}/books`),
        fetch(`${API_URL}/transactions`, { headers })
      ];

      // Only admins can load the registered users list.
      if (isAdmin) {
        requests.push(
          fetch(`${API_URL}/users`, { headers })
        );
      }

      const responses = await Promise.all(requests);

      if (responses.some((response) => !response.ok)) {
        throw new Error('Could not load transaction information.');
      }

      const booksData = await responses[0].json();
      const transactionsData = await responses[1].json();

      setBooks(booksData);
      setTransactions(transactionsData);

      if (isAdmin) {
        const usersData = await responses[2].json();
        setUsers(usersData);
      } else {
        setUsers([]);
      }

    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, currentUser]);

  // HANDLE FORM INPUTS
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // RECORD TRANSACTION
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    if (!token || !currentUser) {
      setError('Please log in before recording a transaction.');
      return;
    }

    if (
      !formData.book_id ||
      !formData.quantity ||
      !Number.isInteger(Number(formData.quantity)) ||
      Number(formData.quantity) < 1
    ) {
      setError('Please select a book and enter a valid quantity.');
      return;
    }

    if (
      isAdmin &&
      formData.transaction_type !== 'restock' &&
      !formData.user_id
    ) {
      setError('Please select a member for this transaction.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          book_id: Number(formData.book_id),

          // Members are automatically identified by the backend.
          user_id: isAdmin && formData.user_id
            ? Number(formData.user_id)
            : null,

          transaction_type: formData.transaction_type,
          quantity: Number(formData.quantity)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Transaction failed.'
        );
      }

      setMessage(data.message || 'Transaction recorded successfully!');

      setFormData({
        book_id: '',
        user_id: '',
        transaction_type: 'borrow',
        quantity: '1'
      });

      await fetchData();

    } catch (err) {
      setError(err.message);
    }
  };

  // GUEST VIEW
  if (!currentUser || !token) {
    return (
      <div>
        <h1 className="page-title">Library Transactions</h1>

        <section className="form-section">
          <h2>Login Required</h2>
          <p>Please log in to borrow, return books or view transaction history.</p>
        </section>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Library Transactions</h1>

      <p className="dashboard-subtitle">
        {isAdmin
          ? 'Manage borrowing, returns and book restocking.'
          : 'Borrow and return books using your member account.'}
      </p>

      <section className="form-section">
        <h2>Record a Transaction</h2>

        <form onSubmit={handleSubmit} className="book-form">

          {/* SELECT BOOK */}
          <label>
            Select Book

            <select
              name="book_id"
              value={formData.book_id}
              onChange={handleChange}
              required
            >
              <option value="">Choose a book</option>

              {books.map((book) => (
                <option key={book.book_id} value={book.book_id}>
                  {book.title} (Available: {book.quantity})
                </option>
              ))}
            </select>
          </label>

          {/* TRANSACTION TYPE */}
          <label>
            Transaction Type

            <select
              name="transaction_type"
              value={formData.transaction_type}
              onChange={handleChange}
            >
              <option value="borrow">Borrow</option>
              <option value="return">Return</option>

              {isAdmin && (
                <option value="restock">Restock</option>
              )}
            </select>
          </label>

          {/* ADMIN MEMBER SELECTION */}
          {isAdmin &&
            formData.transaction_type !== 'restock' && (
              <label>
                Select Member

                <select
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a member</option>

                  {users
                    .filter((user) => user.role === 'member')
                    .map((user) => (
                      <option
                        key={user.user_id}
                        value={user.user_id}
                      >
                        {user.full_name} ({user.membership_id})
                      </option>
                    ))}
                </select>
              </label>
            )}

          {/* MEMBER ACCOUNT INFORMATION */}
          {isMember && (
            <p>
              Member: <strong>{currentUser.full_name}</strong>
              <br />
              Membership ID: {currentUser.membership_id}
            </p>
          )}

          {/* QUANTITY */}
          <label>
            Quantity

            <input
              type="number"
              name="quantity"
              min="1"
              step="1"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit">
            Save Transaction
          </button>

        </form>

        {message && (
          <p className="success-message">{message}</p>
        )}

        {error && (
          <p className="error-message">{error}</p>
        )}
      </section>

      {/* TRANSACTION HISTORY */}
      <section className="dashboard-section">
        <h2>Transaction History</h2>

        {transactions.length === 0 ? (
          <p>No transactions recorded yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="book-table">

              <thead>
                <tr>
                  <th>Book</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.transaction_id}>
                    <td>
                      {transaction.title || transaction.book_title || 'Book'}
                    </td>

                    <td>
                      {transaction.full_name || 'Staff'}
                    </td>

                    <td>{transaction.transaction_type}</td>

                    <td>{transaction.quantity}</td>

                    <td>
                      {new Date(
                        transaction.transaction_date
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </section>
    </div>
  );
}