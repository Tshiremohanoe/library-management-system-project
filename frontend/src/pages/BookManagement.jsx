import { useState, useEffect } from 'react';
import AddBookForm from '../components/AddBookForm';
import BookList from '../components/BookList';

export default function BookManagement({ currentUser, token }) {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const fetchBooks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/books');

      if (!response.ok) {
        throw new Error('Could not load books.');
      }

      const data = await response.json();
      setBooks(data);
      setError('');

    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <div>
      <h1 className="page-title">Book Catalog Management</h1>

      {error && <p className="error-message">{error}</p>}

      {isAdmin && (
        <AddBookForm
          token={token}
          onBookAdded={fetchBooks}
        />
      )}

      <BookList
        books={books}
        onRefresh={fetchBooks}
        currentUser={currentUser}
        token={token}
      />
    </div>
  );
}