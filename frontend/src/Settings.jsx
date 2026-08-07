import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API = ''
function fetchJSON(path, opts) { return fetch(API + path, opts).then(r => r.json()) }

export default function SettingsPage() {
  const [saved, setSaved] = useState([])
  const [favs, setFavs] = useState([])
  const [newSearch, setNewSearch] = useState({ name: '', filters: {}, notify: false })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetchJSON('/api/saved_searches.php').then(d => setSaved(d.saved_searches || []))
    fetchJSON('/api/favorites.php').then(d => setFavs(d.favorites || []))
  }, [msg])

  const saveSearch = async e => {
    e.preventDefault()
    if (!newSearch.name.trim()) return
    const body = JSON.stringify({ name: newSearch.name, filters: newSearch.filters, notify: newSearch.notify })
    await fetchJSON('/api/saved_searches.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
    setNewSearch({ name: '', filters: {}, notify: false })
    setMsg('Saved search created')
    setTimeout(() => setMsg(''), 2000)
  }

  const deleteSearch = async id => {
    await fetchJSON(`/api/saved_searches.php?id=${id}`, { method: 'DELETE' })
    setMsg('Search deleted')
    setTimeout(() => setMsg(''), 2000)
  }

  const removeFav = async id => {
    await fetchJSON(`/api/favorites.php?listing_id=${id}`, { method: 'DELETE' })
    setMsg('Removed from favorites')
    setTimeout(() => setMsg(''), 2000)
  }

  return (
    <div className='wrap'>
      <Link to='/' style={{ fontSize: '.85rem' }}>← Back to listings</Link>
      <h2 style={{ margin: '1rem 0', color: '#58a6ff' }}>Settings</h2>
      {msg && <div style={{ padding: '.6rem', background: '#238636', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>{msg}</div>}

      <section style={{ marginBottom: '2rem' }}>
        <h3>Saved Searches</h3>
        <form onSubmit={saveSearch} style={{ display: 'flex', gap: '.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input placeholder='Name' value={newSearch.name} onChange={e => setNewSearch({ ...newSearch, name: e.target.value })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
            <input type='checkbox' checked={newSearch.notify} onChange={e => setNewSearch({ ...newSearch, notify: e.target.checked })} />
            Notify on new matches
          </label>
          <button type='submit' style={{ background: '#238636', color: '#fff', border: '1px solid #238636', borderRadius: 6, padding: '.3rem .8rem', cursor: 'pointer' }}>Save Search</button>
        </form>
        {saved.length === 0 ? <p style={{ opacity: .5 }}>No saved searches yet.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {saved.map(s => (
              <li key={s.id} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: '.7rem', marginBottom: '.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{s.name}</strong>
                  <span style={{ fontSize: '.75rem', opacity: .6, marginLeft: '.5rem' }}>{s.filters}</span>
                  {s.notify === '1' && <span style={{ fontSize: '.7rem', background: '#1f6feb', color: '#fff', padding: '.1rem .4rem', borderRadius: 4, marginLeft: '.5rem' }}>notify</span>}
                </div>
                <button onClick={() => deleteSearch(s.id)} style={{ background: 'transparent', color: '#f85149', border: '1px solid #f85149', borderRadius: 6, padding: '.2rem .5rem', cursor: 'pointer', fontSize: '.75rem' }}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Favorites</h3>
        {favs.length === 0 ? <p style={{ opacity: .5 }}>No favorites yet. Heart a listing from the browse page.</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {favs.map(f => (
              <div key={f.id} className='card'>
                <div style={{ padding: '.7rem' }}>
                  <div style={{ fontWeight: 600 }}>{f.address}</div>
                  <div style={{ fontSize: '.8rem', opacity: .65 }}>{f.city}, {f.state}</div>
                  <div style={{ fontSize: '.85rem', marginTop: '.3rem' }}><strong>${(+f.price).toLocaleString()}</strong> — {f.beds} bd / {f.baths} ba</div>
                  <button onClick={() => removeFav(f.listing_id)} style={{ marginTop: '.5rem', background: 'transparent', color: '#f85149', border: '1px solid #f85149', borderRadius: 6, padding: '.2rem .5rem', cursor: 'pointer', fontSize: '.75rem' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
