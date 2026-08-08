import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import SettingsPage from './Settings.jsx'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' })

const API = ''

function fetchJSON(path) { return fetch(API + path).then(r => r.json()) }
function csv(rows, cols) {
  const esc = s => `"${(s ?? '').toString().replace(/"/g, '""')}"`
  return [cols.map(c => c.label).join(','), ...rows.map(r => cols.map(c => esc(r[c.key])).join(','))].join('\n')
}

/* ── Layout ── */
function Layout({ children }) {
  return (
    <>
      <header className='header'>
        <div><h1>Home Finder</h1></div>
        <nav>
          <Link to='/' style={{color:'#8b949e'}}>Browse</Link>
          <Link to='/map' style={{color:'#8b949e'}}>Map</Link>
          <Link to='/settings' style={{color:'#8b949e'}}>Settings</Link>
        </nav>
      </header>
      <main style={{padding:'1rem 1.5rem'}}>{children}</main>
    </>
  )
}

/* ── Saved Searches drop-down ── */
function SavedSearches({ onApply }) {
  const [saved, setSaved] = useState([])
  const [open, setOpen] = useState(false)
  useEffect(() => { fetchJSON('/api/saved_searches.php').then(d => setSaved(d.saved_searches || [])) }, [])
  if (saved.length === 0) return null
  return (
    <div style={{marginBottom:'1rem'}}>
      <button onClick={() => setOpen(!open)} style={{background:'#161b22',color:'#8b949e',border:'1px solid #30363d',padding:'.5rem 1rem',borderRadius:6,cursor:'pointer',fontSize:'.9rem'}}>
        ▼ Saved Searches ({saved.length})
      </button>
      {open && (
        <div style={{marginTop:'.5rem',background:'#161b22',border:'1px solid #30363d',borderRadius:8,padding:'.7rem',maxWidth:480}}>
          {saved.map(s => (
            <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'.5rem 0',borderBottom:'1px solid #21262d'}}>
              <div>
                <strong style={{color:'#e6edf3'}}>{s.name}</strong>
                <div style={{fontSize:'.75rem',opacity:.6}}>{s.filters}</div>
              </div>
              <button onClick={() => { onApply(JSON.parse(s.filters || '{}')); setOpen(false); }} style={{background:'#238636',color:'#fff',border:'none',borderRadius:6,padding:'.3rem .7rem',cursor:'pointer',fontSize:'.75rem'}}>Apply</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Filters component ── */
function Filters({ defaults, onSearch }) {
  const [state, setState] = useState(defaults)
  const [opts, setOpts] = useState({ cities: [], states: [] })
  useEffect(() => { fetchJSON('/api/filters.php').then(d => setOpts(d)) }, [])
  useEffect(() => { setState(defaults) }, [defaults])

  const submit = e => { e.preventDefault(); onSearch(state) }
  const clear = () => {
    const preserved = {}
    // keep lat/lng bounds across clear
    if (state.lat_min) preserved.lat_min = state.lat_min
    if (state.lat_max) preserved.lat_max = state.lat_max
    if (state.lng_min) preserved.lng_min = state.lng_min
    if (state.lng_max) preserved.lng_max = state.lng_max
    setState(preserved)
    onSearch(preserved)
  }
  const hasBounds = state.lat_min && state.lat_max && state.lng_min && state.lng_max

  return (
    <div>
      {hasBounds && (
        <div style={{background:'#161b22',border:'1px solid #1f6feb',borderRadius:8,padding:'.7rem 1rem',marginBottom:'.8rem',display:'flex',alignItems:'center',gap:'.8rem'}}>
          <span style={{fontSize:'.9rem'}}>📍 Map area bounded search active</span>
          <button type='button' onClick={()=>{ const s={...state}; delete s.lat_min; delete s.lat_max; delete s.lng_min; delete s.lng_max; setState(s); onSearch(s); }}
            style={{marginLeft:'auto',background:'transparent',color:'#f85149',border:'1px solid #f85149',padding:'.25rem .6rem',borderRadius:4,cursor:'pointer',fontSize:'.8rem'}}>Clear bounds</button>
        </div>
      )}
      <form style={{display:'flex',flexWrap:'wrap',gap:'.6rem 1rem',marginBottom:'1.2rem',padding:'.9rem',background:'#161b22',border:'1px solid #30363d',borderRadius:'8px',alignItems:'flex-end'}} onSubmit={submit}>
        <input type='hidden' value={state.lat_min||''} />
        <input type='hidden' value={state.lat_max||''} />
        <input type='hidden' value={state.lng_min||''} />
        <input type='hidden' value={state.lng_max||''} />
        <label>Min $<input type='number' value={state.min_price || ''} onChange={e=>setState({...state, min_price:e.target.value})} /></label>
        <label>Max $<input type='number' value={state.max_price || ''} onChange={e=>setState({...state, max_price:e.target.value})} /></label>
        <label>Beds ≥<input type='number' step='0.5' value={state.min_beds || ''} onChange={e=>setState({...state, min_beds:e.target.value})} /></label>
        <label>Baths ≥<input type='number' step='0.5' value={state.min_baths || ''} onChange={e=>setState({...state, min_baths:e.target.value})} /></label>
        <label>Lot(ac) ≥<input type='number' step='0.5' value={state.min_lot || ''} onChange={e=>setState({...state, min_lot:e.target.value})} /></label>
        <label>State
          <select value={state.state||''} onChange={e=>setState({...state, state:e.target.value})}>
            <option value=''>Any</option>
            {opts.states.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>City
          <select value={state.city||''} onChange={e=>setState({...state, city:e.target.value})}>
            <option value=''>Any</option>
            {opts.cities.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Search<input type='text' value={state.q||''} placeholder='address, zip...' onChange={e=>setState({...state, q:e.target.value})} /></label>
        <label>Sort
          <select value={state.sort||'price_asc'} onChange={e=>setState({...state, sort:e.target.value})}>
            <option value='price_asc'>Price ▲</option>
            <option value='price_desc'>Price ▼</option>
            <option value='beds_desc'>Beds ▼</option>
            <option value='lot_desc'>Lot ▼</option>
            <option value='newest'>Newest</option>
          </select>
        </label>
        <button type='submit' style={{background:'#238636',color:'#fff',fontWeight:600,padding:'.5rem 1.2rem',borderRadius:6,border:'1px solid #238636',cursor:'pointer'}}>Search</button>
        <button type='button' onClick={clear} style={{background:'transparent',color:'#8b949e',border:'1px solid #30363d',padding:'.5rem .8rem',borderRadius:6,cursor:'pointer'}}>Clear</button>
        <label style={{display:'flex',alignItems:'center',gap:'.4rem',fontSize:'.85rem',color:'#8b949e'}}>
          <input type='checkbox' checked={!!state.all} onChange={e=>setState({...state, all: e.target.checked ? '1' : ''})} />
          Show duplicates
        </label>
      </form>
    </div>
  )
}

/* ── Card ── */
function Card({ row, favIds, onToggleFav }) {
  const isFav = favIds.has(row.id)
  return (
    <div className='card' style={{ position: 'relative', padding: '1rem' }}>
      <button onClick={() => onToggleFav(row.id)} style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, background: 'rgba(13,17,23,.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem', color: isFav ? '#f85149' : '#8b949e' }}>
        {isFav ? '♥' : '♡'}
      </button>
      <div style={{fontWeight:600,color:'#e6edf3',fontSize:'1.05rem',marginBottom:'.25rem'}}>
        <a href={row.url} target='_blank' rel='noreferrer' style={{color:'#e6edf3'}}>{row.address}</a>
      </div>
      <div style={{fontSize:'.82rem',opacity:.65,marginBottom:'.6rem'}}>{row.city}, {row.state} {row.zip}</div>
      <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',marginBottom:'.5rem'}}>
        <span style={{fontWeight:700,color:'#3fb950',fontSize:'.95rem'}}>${(+row.price).toLocaleString()}</span>
        {row.beds ? <span style={{background:'#21262d',padding:'.15rem .5rem',borderRadius:4,fontSize:'.75rem'}}>{row.beds} bd / {row.baths} ba</span> : null}
        {row.sqft ? <span style={{background:'#21262d',padding:'.15rem .5rem',borderRadius:4,fontSize:'.75rem'}}>{(+row.sqft).toLocaleString()} sqft</span> : null}
        {row.lot_size_sqft ? <span style={{background:'#21262d',padding:'.15rem .5rem',borderRadius:4,fontSize:'.75rem'}}>{(+row.lot_size_sqft/43560).toFixed(1)} ac</span> : null}
      </div>
      <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap',fontSize:'.75rem'}}>
        <span style={{background:'#1f6feb',color:'#fff',padding:'.1rem .4rem',borderRadius:4}}>{row.source.split('-')[0]}</span>
        <span style={{background:'#21262d',padding:'.1rem .4rem',borderRadius:4,color:'#8b949e'}}>{row.status}</span>
      </div>
      <div style={{marginTop:'.6rem'}}>
        <Link to={`/listing/${row.id}`} style={{fontSize:'.8rem'}}>View history & details →</Link>
      </div>
    </div>
  )
}

/* ── Browse route ── */
function Browse() {
  const [sp, setSp] = useSearchParams()
  const [filters, setFilters] = useState(Object.fromEntries([...sp.entries()]))
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)

  const page = parseInt(filters.page || '1', 10)
  const query = new URLSearchParams({ ...filters, page: String(page) }).toString()

  useEffect(() => { fetchJSON('/api/stats.php').then(d => setStats(d)) }, [])
  useEffect(() => { setData(null); fetchJSON(`/api/listings.php?${query}`).then(d => setData(d)) }, [query])
  useEffect(() => { setSp(new URLSearchParams(filters), {replace:true}) }, [filters])

  // Favorites
  const [favIds, setFavIds] = useState(new Set())
  useEffect(() => { fetchJSON('/api/favorites.php').then(d => setFavIds(new Set((d.favorites || []).map(f => f.listing_id)))) }, [])
  const toggleFav = async id => {
    const isFav = favIds.has(id)
    await fetchJSON(`/api/favorites.php?listing_id=${id}`, { method: isFav ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listing_id: id }) })
    setFavIds(prev => { const n = new Set(prev); if (isFav) n.delete(id); else n.add(id); return n; })
  }

  const exportCSV = () => {
    if (!data || !data.listings) return
    const b = new Blob([csv(data.listings, [
      {label:'ID',key:'id'},{label:'Address',key:'address'},{label:'City',key:'city'},
      {label:'State',key:'state'},{label:'Zip',key:'zip'},{label:'Price',key:'price'},
      {label:'Beds',key:'beds'},{label:'Baths',key:'baths'},{label:'Sqft',key:'sqft'},
      {label:'Lot_ac',key:'lot_size_sqft'},{label:'Status',key:'status'},{label:'URL',key:'url'}
    ])], {type:'text/csv'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b)
    a.download = 'homefinder.csv'
    a.click()
  }

  return (
    <div className='wrap'>
      <div style={{display:'flex',gap:'1.5rem',marginBottom:'1rem',fontSize:'.85rem',opacity:.8,flexWrap:'wrap'}}>
        <span style={{background:'#161b22',padding:'.4rem .8rem',borderRadius:6,border:'1px solid #30363d'}}>Active: <strong>{(+stats?.total || 0).toLocaleString()}</strong></span>
        <span style={{background:'#161b22',padding:'.4rem .8rem',borderRadius:6,border:'1px solid #30363d'}}>Min: <strong>${(+stats?.min_price || 0).toLocaleString()}</strong></span>
        <span style={{background:'#161b22',padding:'.4rem .8rem',borderRadius:6,border:'1px solid #30363d'}}>Max: <strong>${(+stats?.max_price || 0).toLocaleString()}</strong></span>
        {data && <span style={{background:'#161b22',padding:'.4rem .8rem',borderRadius:6,border:'1px solid #30363d'}}>Results: <strong>{data.total.toLocaleString()}</strong></span>}
      </div>
      <Filters defaults={filters} onSearch={setFilters} />
      <SavedSearches onApply={setFilters} />
      <button onClick={exportCSV} style={{marginBottom:'1rem'}}>Export CSV</button>
      {!data ? <p style={{opacity:.5}}>Loading...</p> : (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
            {data.listings.map(row => <Card key={row.id} row={row} favIds={favIds} onToggleFav={toggleFav} />)}
          </div>
          {data.pages > 1 && (
            <div style={{marginTop:'1.5rem',display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
              {Array.from({length:data.pages}, (_,i)=>i+1).map(p => (
                p === data.page ? (
                  <span key={p} style={{background:'#238636',color:'#fff',padding:'.3rem .6rem',borderRadius:4}}>{p}</span>
                ) : (
                  <button key={p} style={{minWidth:30,padding:'.3rem .6rem'}} onClick={()=>setFilters({...filters, page:String(p)})}>{p}</button>
                )
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Map route ── */
import { useMapEvents } from 'react-leaflet'

function MapBoundsFilter({ onBoundsChange }) {
  useMapEvents({
    moveend: e => onBoundsChange(e.target.getBounds()),
  })
  return null
}

function MapPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [searchBounds, setSearchBounds] = useState(null)
  const [hasMoved, setHasMoved] = useState(false)

  useEffect(() => {
    fetchJSON('/api/listings.php?per_page=9999').then(d => {
      setRows(d.listings.filter(r => r.latitude && r.longitude))
    })
  }, [])

  const handleBoundsChange = bounds => {
    setHasMoved(true)
    setSearchBounds(bounds)
  }

  const searchArea = () => {
    if (!searchBounds) return
    const sw = searchBounds.getSouthWest()
    const ne = searchBounds.getNorthEast()
    const params = new URLSearchParams({
      lat_min: String(sw.lat),
      lat_max: String(ne.lat),
      lng_min: String(sw.lng),
      lng_max: String(ne.lng),
      per_page: '50',
    })
    navigate('/?' + params.toString())
  }

  if (!rows.length) return <p style={{padding:'1rem',opacity:.5}}>Loading map...</p>
  const center = [+rows[0].latitude, +rows[0].longitude]
  const boundsCount = searchBounds
    ? rows.filter(r => {
        const sw = searchBounds.getSouthWest()
        const ne = searchBounds.getNorthEast()
        const lat = +r.latitude
        const lng = +r.longitude
        return lat >= sw.lat && lat <= ne.lat && lng >= sw.lng && lng <= ne.lng
      }).length
    : 0

  return (
    <div>
      <div style={{display:'flex',gap:'.5rem',alignItems:'center',marginBottom:'.5rem',flexWrap:'wrap'}}>
        {hasMoved ? (
          <>
            <button style={{padding:'.4rem .8rem',borderRadius:6,border:'1px solid #238636',background:'#238636',color:'#fff',cursor:'pointer'}}
              onClick={searchArea}>
              🔍 Search this area ({boundsCount})
            </button>
          </>
        ) : null}
        <span style={{color:'#8b949e',fontSize:'.85rem',marginLeft:'auto'}}>
          Pan the map to search a specific area
        </span>
      </div>

      <div style={{height:'80vh',border:'1px solid #30363d',borderRadius:8,overflow:'hidden'}}>
        <MapContainer center={center} zoom={6} style={{height:'100%',width:'100%'}}>
          <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
          <MapBoundsFilter onBoundsChange={handleBoundsChange} />
          {rows.map(r => (
            <Marker key={r.id} position={[+r.latitude, +r.longitude]}>
              <Popup>
                <a href={r.url} target='_blank' rel='noreferrer'>{r.address}</a>
                <br/>${(+r.price).toLocaleString()} — {r.beds} bd / {r.baths} ba
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

/* ── Detail / History route ── */
function ListingDetail() {
  const { id } = useParams()
  const [row, setRow] = useState(null)
  const [hist, setHist] = useState([])
  useEffect(() => { fetchJSON(`/api/listing.php?id=${id}`).then(d => setRow(d)) }, [id])
  useEffect(() => { fetchJSON(`/api/history.php?id=${id}`).then(d => setHist(d)) }, [id])
  if (!row) return <p style={{padding:'1rem',opacity:.5}}>Loading...</p>
  const historyRows = hist.map(h => ({ date: h.checked_at.split(' ')[0], price: +h.price })).reverse()
  return (
    <div className='wrap'>
      <Link to='/' style={{fontSize:'.85rem'}}>← Back to listings</Link>
      <h2 style={{margin:'1rem 0',color:'#58a6ff'}}>{row.address}</h2>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
        <div>
          <div style={{background:'#161b22',borderRadius:8,padding:'1.2rem',border:'1px solid #30363d'}}>
            <div style={{fontWeight:700,color:'#3fb950',fontSize:'1.1rem',marginBottom:'.5rem'}}>${(+row.price).toLocaleString()}</div>
            <div style={{opacity:.7,marginBottom:'.3rem'}}>{row.status}</div>
            <div>{row.city}, {row.state} {row.zip}</div>
            {row.beds ? <div>{row.beds} bd / {row.baths} ba</div> : null}
            {row.sqft ? <div>{(+row.sqft).toLocaleString()} sqft</div> : null}
            {row.lot_size_sqft ? <div>{(row.lot_size_sqft/43560).toFixed(1)} acres</div> : null}
            <div style={{marginTop:'.7rem'}}><a href={row.url} target='_blank' rel='noreferrer'>View on Redfin →</a></div>
          </div>
        </div>
        <div>
          <h3>Price History</h3>
          {historyRows.length ? (
            <ResponsiveContainer width='100%' height={250}>
              <LineChart data={historyRows}>
                <XAxis dataKey='date' tick={{fontSize:11,fill:'#8b949e'}} />
                <YAxis tick={{fontSize:11,fill:'#8b949e'}} />
                <Tooltip contentStyle={{background:'#161b22',border:'1px solid #30363d',color:'#c9d1d9'}} />
                <Line type='monotone' dataKey='price' stroke='#58a6ff' strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p style={{opacity:.5}}>No history yet.</p>}
          <div style={{marginTop:'1rem'}}>
            <p style={{fontSize:'.8rem',opacity:.6}}>Source ID: {row.source_id}</p>
            <p style={{fontSize:'.8rem',opacity:.6}}>First seen: {row.first_seen || 'N/A'}</p>
            <p style={{fontSize:'.8rem',opacity:.6}}>Last seen: {row.last_seen || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── App ── */
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path='/' element={<Browse/>} />
        <Route path='/map' element={<MapPage/>} />
        <Route path='/listing/:id' element={<ListingDetail/>} />
        <Route path='/settings' element={<SettingsPage/>} />
      </Routes>
    </Layout>
  )
}
