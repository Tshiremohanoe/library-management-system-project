import { useState } from 'react';

export default function BookList({
  books,
  onRefresh,
  currentUser,
  token
}) {
  const [editingBook, setEditingBook] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  // DELETE BOOK - ADMIN ONLY
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/books/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Could not delete book.'
        );
      }

      setError('');
      await onRefresh();

    } catch (err) {
      setError(err.message);
    }
  };

  // UPDATE BOOK - ADMIN ONLY
  const handleUpdate = async (e) => {
    e.preventDefault();

    setError('');

    if (!token) {
      setError('Please log in as an administrator.');
      return;
    }

    if (
      !editingBook.title.trim() ||
      !editingBook.author.trim() ||
      editingBook.quantity === '' ||
      !Number.isInteger(Number(editingBook.quantity)) ||
      Number(editingBook.quantity) < 0
    ) {
      setError('Please enter valid book details.');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/books/${editingBook.book_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: editingBook.title,
            author: editingBook.author,
            genre: editingBook.genre,
            isbn: editingBook.isbn,
            quantity: Number(editingBook.quantity)
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Could not update book.'
        );
      }

      setEditingBook(null);
      setError('');

      await onRefresh();

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="book-list-section">
      <h2>Book Collection</h2>

      {error && <p className="error-message">{error}</p>}

      {/* EDIT FORM - ADMIN ONLY */}
      {isAdmin && editingBook && (
        <form onSubmit={handleUpdate} className="book-form">
          <h3>Edit Book</h3>

          {['title', 'author', 'genre', 'isbn', 'quantity'].map((field) => (
            <input
              key={field}
              type={field === 'quantity' ? 'number' : 'text'}
              min={field === 'quantity' ? '0' : undefined}
              step={field === 'quantity' ? '1' : undefined}
              placeholder={
                field.charAt(0).toUpperCase() + field.slice(1)
              }
              value={editingBook[field] ?? ''}
              onChange={(e) =>
                setEditingBook({
                  ...editingBook,
                  [field]: e.target.value
                })
              }
              required={['title', 'author', 'quantity'].includes(field)}
            />
          ))}

          <button type="submit">Save Changes</button>

          <button
            type="button"
            onClick={() => setEditingBook(null)}
          >
            Cancel
          </button>
        </form>
      )}

      {books.length === 0 ? (
        <p>No books available yet.</p>
      ) : (
        <div className="table-wrapper">
          <table className="book-table">

            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Genre</th>
                <th>ISBN</th>
                <th>Quantity</th>

                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {books.map((book) => (
                <tr key={book.book_id}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.genre || '-'}</td>
                  <td>{book.isbn || '-'}</td>

                  <td>
                    <span
                      className={
                        book.quantity < 2 ? 'low-stock' : ''
                      }
                    >
                      {book.quantity}
                    </span>
                  </td>

                  {isAdmin && (
                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingBook({ ...book })
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(book.book_id)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}
    </section>
  );
}