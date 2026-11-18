import { useState } from 'react';

export default function AddBookForm({ onBookAdded, token }) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    isbn: '',
    quantity: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    if (!token) {
      setError('Please log in as an administrator.');
      return;
    }

    if (
      !formData.title.trim() ||
      !formData.author.trim() ||
      formData.quantity === '' ||
      !Number.isInteger(Number(formData.quantity)) ||
      Number(formData.quantity) < 0
    ) {
      setError('Please enter valid book details.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Could not add book.');
      }

      setMessage('Book added successfully!');

      setFormData({
        title: '',
        author: '',
        genre: '',
        isbn: '',
        quantity: ''
      });

      await onBookAdded();

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="form-section">
      <h2>Add New Book</h2>

      <form onSubmit={handleSubmit} className="book-form">
        <input
          type="text"
          name="title"
          placeholder="Book Title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="author"
          placeholder="Author"
          value={formData.author}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="genre"
          placeholder="Genre"
          value={formData.genre}
          onChange={handleChange}
        />

        <input
          type="text"
          name="isbn"
          placeholder="ISBN"
          value={formData.isbn}
          onChange={handleChange}
        />

        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          min="0"
          step="1"
          value={formData.quantity}
          onChange={handleChange}
          required
        />

        <button type="submit">Add Book</button>
      </form>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </section>
  );
}