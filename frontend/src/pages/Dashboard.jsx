import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/api';

export default function Dashboard({ currentUser, token }) {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const isLoggedIn = Boolean(currentUser && token);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError('');

        // Books are publicly accessible.
        const booksResponse = await fetch(`${API_URL}/books`);

        if (!booksResponse.ok) {
          throw new Error('Could not load book information.');
        }

        setBooks(await booksResponse.json());

        // Guests do not have access to transaction information.
        if (!isLoggedIn) {
          setTransactions([]);
          setUsers([]);
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`
        };

        const transactionsResponse = await fetch(
          `${API_URL}/transactions`,
          { headers }
        );

        if (!transactionsResponse.ok) {
          throw new Error('Could not load transaction information.');
        }

        setTransactions(await transactionsResponse.json());

        // Only administrators can view registered users.
        if (isAdmin) {
          const usersResponse = await fetch(
            `${API_URL}/users`,
            { headers }
          );

          if (!usersResponse.ok) {
            throw new Error('Could not load registered users.');
          }

          setUsers(await usersResponse.json());
        } else {
          setUsers([]);
        }

      } catch (err) {
        setError(err.message);
      }
    };

    fetchDashboardData();
  }, [currentUser, token]);

  // Total book titles.
  const totalBookTitles = books.length;

  // Total available copies.
  const availableCopies = books.reduce(
    (total, book) => total + Number(book.quantity),
    0
  );

  // Calculate outstanding borrowed copies from visible transactions.
  const borrowedByBook = {};

  transactions.forEach((transaction) => {
    const bookId = transaction.book_id;

    if (!borrowedByBook[bookId]) {
      borrowedByBook[bookId] = 0;
    }

    if (transaction.transaction_type === 'borrow') {
      borrowedByBook[bookId] += Number(transaction.quantity);
    }

    if (transaction.transaction_type === 'return') {
      borrowedByBook[bookId] -= Number(transaction.quantity);
    }
  });

  const currentlyBorrowed = Object.values(borrowedByBook).reduce(
    (total, quantity) => total + Math.max(0, quantity),
    0
  );

  // Books with fewer than two available copies.
  const lowStockBooks = books.filter(
    (book) => Number(book.quantity) < 2
  );

  return (
    <div className="dashboard">
      <h1 className="page-title">Library Dashboard</h1>

      <p className="dashboard-subtitle">
        Overview of your library's activities and collection.
      </p>

      {error && <p className="error-message">{error}</p>}

      {/* DASHBOARD STATISTICS */}
      <div className="dashboard-stats">

        <div className="stat-card">
          <h3>Total Book Titles</h3>
          <p>{totalBookTitles}</p>
        </div>

        <div className="stat-card">
          <h3>Available Copies</h3>
          <p>{availableCopies}</p>
        </div>

        {isLoggedIn && (
          <div className="stat-card">
            <h3>
              {isAdmin ? 'Currently Borrowed' : 'My Borrowed Books'}
            </h3>
            <p>{currentlyBorrowed}</p>
          </div>
        )}

        {isAdmin && (
          <div className="stat-card">
            <h3>Registered Users</h3>
            <p>{users.length}</p>
          </div>
        )}

      </div>

      {/* BOOK AVAILABILITY */}
      <section className="dashboard-section">
        <h2>Book Availability</h2>

        {books.length === 0 ? (
          <p>No books have been added yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="book-table">

              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Author</th>
                  <th>Genre</th>
                  <th>Available Copies</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {books.map((book) => (
                  <tr key={book.book_id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.genre || '-'}</td>
                    <td>{book.quantity}</td>

                    <td>
                      {Number(book.quantity) < 2 ? (
                        <span className="low-stock">
                          Low Stock
                        </span>
                      ) : (
                        <span>Available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

        {lowStockBooks.length > 0 && (
          <p className="error-message">
            Attention: {lowStockBooks.length} book title(s) have low stock.
          </p>
        )}
      </section>

      {/* RECENT TRANSACTIONS */}
      <section className="dashboard-section">
        <h2>Recent Activity</h2>

        {!isLoggedIn ? (
          <p>Please log in to view transaction activity.</p>
        ) : transactions.length === 0 ? (
          <p>No transactions recorded yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="book-table">

              <thead>
                <tr>
                  <th>Book</th>
                  <th>User</th>
                  <th>Transaction</th>
                  <th>Quantity</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {transactions.slice(0, 5).map((transaction) => (
                  <tr key={transaction.transaction_id}>
                    <td>{transaction.title || 'Book'}</td>
                    <td>{transaction.full_name || 'Staff'}</td>
                    <td>{transaction.transaction_type}</td>
                    <td>{transaction.quantity}</td>

                    <td>
                      {new Date(
                        transaction.transaction_date
                      ).toLocaleDateString()}
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