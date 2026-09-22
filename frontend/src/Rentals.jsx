import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Filters from './App.jsx'

const API = ''
function fetchJSON(path) { return fetch(API + path).then(r => r.json()) }

export default function RentalsPage() {
  const [sp, setSp] = useSearchParams()
  const [filters, setFilters] = useState(Object.fromEntries([...sp.entries()]))
  const [data, setData] = useState(null)
  const page = parseInt(filters.page || '1', 10)
  const baseQuery = new URLSearchParams({ ...filters, page: String(page), per_page: '24', listing_type: 'rental' }).toString()
  const endpoint = `/api/listings.php?${baseQuery}`

  useEffect(() => { fetchJSON(endpoint).then(d => setData(d)) }, [endpoint])
  useEffect(() => { setSp(new URLSearchParams(filters), { replace: true }) }, [filters])

  return (
    <div className='wrap'>
      <h2 style={{ margin: '1rem 0', color: '#58a6ff' }}>Home Rentals</h2>
      <Filters defaults={filters} onSearch={setFilters} />
      {!data ? <p style={{ opacity: .5 }}>Loading rentals...</p> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
            {data.listings.map(row => (
              <div key={row.id} className='card' style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 600, color: '#e6edf3', fontSize: '1.05rem', marginBottom: '.25rem' }}>
                  <a href={row.url} target='_blank' rel='noreferrer' style={{ color: '#e6edf3' }}>{row.address}</a>
                </div>
                <div style={{ fontSize: '.82rem', opacity: .65, marginBottom: '.6rem' }}>{row.city}, {row.state} {row.zip}</div>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#3fb950', fontSize: '.95rem' }}>${(+row.price).toLocaleString()}/mo</span>
                  {row.beds ? <span style={{ background: '#21262d', padding: '.15rem .5rem', borderRadius: 4, fontSize: '.75rem' }}>{row.beds} bd / {row.baths} ba</span> : null}
                  {row.sqft ? <span style={{ background: '#21262d', padding: '.15rem .5rem', borderRadius: 4, fontSize: '.75rem' }}>{(+row.sqft).toLocaleString()} sqft</span> : null}
                </div>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', fontSize: '.75rem' }}>
                  <span style={{ background: '#1f6feb', color: '#fff', padding: '.1rem .4rem', borderRadius: 4 }}>{row.source.split('-')[0]}</span>
                  <span style={{ background: '#21262d', padding: '.1rem .4rem', borderRadius: 4, color: '#8b949e' }}>{row.status}</span>
                </div>
              </div>
            ))}
          </div>
          {data.pages > 1 && (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
                <button key={p} style={{ minWidth: 30, padding: '.3rem .6rem' }} onClick={() => setFilters({ ...filters, page: String(p) })}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
