'use client';

import { useState } from 'react';

/** Swap the body of handleSubmit for a POST to ConvertKit or Beehiiv once you
 *  have an account. Until then it validates and says plainly that nothing
 *  was stored, which is better than pretending to subscribe someone. */
export default function Signup() {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError(true);
      setNote('Enter a valid email address.');
      return;
    }
    setError(false);
    setNote('Not connected yet. Nothing was sent and no address was stored.');
    setEmail('');
  };

  return (
    <section className="signup">
      <h2>The Matter Edit</h2>
      <p>New finds, seasonal selections, and short material intelligence. Roughly twice a month.</p>
      <form className="sform" onSubmit={handleSubmit}>
        <label htmlFor="email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Email address
        </label>
        <input
          id="email" type="email" placeholder="Email address" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Subscribe</button>
      </form>
      <p className="note" role="status" style={error ? { color: 'var(--oxblood)' } : undefined}>
        {note}
      </p>
    </section>
  );
}
