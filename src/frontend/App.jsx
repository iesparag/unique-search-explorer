import React, { useState } from 'react';

export function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemSource, setNewItemSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const queryParam = searchTerm.trim() ? `?query=${encodeURIComponent(searchTerm.trim())}` : '';
      const res = await fetch(`/items${queryParam}&limit=20`);
      if (!res.ok) {
        throw new Error(`Search failed with status ${res.status}`);
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      setError(`Search error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem(e) {
    e.preventDefault();
    setError(null);
    if (!newItemContent.trim()) {
      setError('Content is required to add an item.');
      return;
    }
    setLoading(true);
    try {
      const body = {
        content: newItemContent.trim(),
      };
      if (newItemTitle.trim()) body.title = newItemTitle.trim();
      if (newItemSource.trim()) body.source = newItemSource.trim();

      const res = await fetch('/items', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Add item failed with status ${res.status}`);
      }

      // Clear input fields
      setNewItemContent('');
      setNewItemTitle('');
      setNewItemSource('');

      // Refresh search results or add to items list
      // Just prepend new item to items state
      const addedItem = await res.json();
      setItems([addedItem, ...items]);
    } catch (err) {
      setError(`Add item error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: '1rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Welcome to Unique Search Explorer</h1>

      <section style={{ padding: '0.5rem', marginBottom: '2rem', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h2>Search Items</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            type="text"
            aria-label="Search query"
            placeholder="Enter search term"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            disabled={loading}
            style={{flexGrow: 1, padding: '0.4rem'}}
          />
          <button type="submit" disabled={loading}>Search</button>
        </form>

        {loading && <p>Loading...</p>}
        {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}

        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {items.length === 0 && !loading && <li>No items found.</li>}
          {items.map(item => (
            <li key={item._id} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0' }}>
              <strong>{item.title || '(no title)'}</strong><br />
              <span>{item.content}</span><br />
              <small>Frequency: {item.frequency ?? 'N/A'}, Tag: {item.uniquenessTag ?? 'N/A'}</small><br />
              {item.source && <small>Source: {item.source}</small>}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h2>Add New Item</h2>
        <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <textarea
            aria-label="New item content"
            placeholder="Content (required)"
            value={newItemContent}
            onChange={e => setNewItemContent(e.target.value)}
            rows={3}
            disabled={loading}
            required
            style={{resize: 'vertical', padding: '0.4rem'}}
          />
          <input
            type="text"
            aria-label="New item title"
            placeholder="Title (optional)"
            value={newItemTitle}
            onChange={e => setNewItemTitle(e.target.value)}
            disabled={loading}
            style={{padding: '0.4rem'}}
          />
          <input
            type="text"
            aria-label="New item source"
            placeholder="Source (optional)"
            value={newItemSource}
            onChange={e => setNewItemSource(e.target.value)}
            disabled={loading}
            style={{padding: '0.4rem'}}
          />
          <button type="submit" disabled={loading}>Add Item</button>
        </form>
      </section>
    </main>
  );
}
