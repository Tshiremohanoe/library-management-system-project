import { useEffect, useState } from 'react';

const createEmptyForm = () => ({
  full_name: '',
  membership_id: '',
  username: '',
  password: '',
  role: 'member'
});

export default function UserForm({ selectedUser, onSave, onCancel }) {
  const [formData, setFormData] = useState(createEmptyForm);

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        full_name: selectedUser.full_name || '',
        membership_id: selectedUser.membership_id || '',
        username: selectedUser.username || '',
        password: '',
        role: selectedUser.role || 'member'
      });
    } else {
      setFormData(createEmptyForm());
    }
  }, [selectedUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await onSave({
      ...formData,
      password: formData.password.trim()
    });

    if (success) {
      setFormData(createEmptyForm());
    }
  };

  return (
    <section className="form-section">
      <h2>{selectedUser ? 'Update User' : 'Add New User'}</h2>

      <form
        onSubmit={handleSubmit}
        className="book-form"
        autoComplete="off"
      >
        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={handleChange}
          autoComplete="off"
          required
        />

        <input
          type="text"
          name="membership_id"
          placeholder="Membership ID"
          value={formData.membership_id}
          onChange={handleChange}
          autoComplete="off"
          required
        />

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          autoComplete="off"
          required
        />

        <input
          type="password"
          name="password"
          placeholder={selectedUser ? 'New Password (optional)' : 'Password'}
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          required={!selectedUser}
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit">
          {selectedUser ? 'Save Changes' : 'Add User'}
        </button>

        {selectedUser && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </form>
    </section>
  );
}