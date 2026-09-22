import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import SettingsPage from './Settings.jsx'
import RentalsPage from './Rentals.jsx'
import Filters from './Filters.jsx'
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
          <Link to='/rentals' style={{color:'#8b949e'}}>Rentals</Link>
          <Link to='/settings' style={{color:'#8b949e'}}>Settings</Link>
        </nav>
      </header>
      <main style={{padding:'1rem 1.5rem'}}>{children}</main>
    </>
  )
}

/* ── Save Search Button ── */
function SaveSearchButton({ filters }) {
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const hasFilters = Object.keys(filters).some(k => filters[k] && !['page','per_page','sort'].includes(k))
  if (!hasFilters) return null
  const save = async () => {
    if (!name.trim()) { setMsg('Enter a name'); return }
    const payload = { name: name.trim(), filters }
    try {
      const r = await fetch('/api/saved_searches.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      const data = await r.json()
      if (data.ok || data.id) { setMsg('Saved'); setName(''); setTimeout(()=>setMsg(''),2000) }
      else { setMsg('Failed: ' + (data.error || 'unknown')) }
    } catch (e) { setMsg('Failed') }
  }
  return (
    <div style={{marginBottom:'1rem',display:'flex',gap:'.5rem',alignItems:'center',flexWrap:'wrap'}}>
      <input value={name} onChange={e=>{setName(e.target.value); setMsg('')}} placeholder='Search name...' style={{background:'#161b22',color:'#e6edf3',border:'1px solid #30363d',borderRadius:6,padding:'.4rem .7rem',fontSize:'.85rem'}}></input>
      <button onClick={save} style={{background:'#1f6feb',color:'#fff',border:'none',borderRadius:6,padding:'.4rem .8rem',cursor:'pointer',fontSize:'.85rem'}}>💾 Save current search</button>
      {msg && <span style={{fontSize:'.85rem',color:msg==='Saved'?'#3fb950':'#f85149'}}>{msg}</span>}
    </div>
  )
}

/* ── Saved Searches drop-down ── */
function SavedSearches({ onApply }) {
  const [saved, setSaved] = useState([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editFilters, setEditFilters] = useState({})
  useEffect(() => { fetchJSON('/api/saved_searches.php').then(d => setSaved(d.saved_searches || [])) }, [])
  if (saved.length === 0) return null

  const startEdit = (s) => {
    setEditingId(s.id)
    setEditName(s.name)
    setEditFilters(typeof s.filters === 'string' ? JSON.parse(s.filters || '{}') : (s.filters || {}))
  }
  const saveEdit = async () => {
    if (!editName.trim()) return
    const r = await fetch('/api/saved_searches.php', {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id: editingId, name: editName.trim(), filters: editFilters })
    })
    const d = await r.json()
    if (d.ok) {
      setEditingId(null)
      setSaved(list => list.map(s => s.id === editingId ? {...s, name: editName.trim(), filters: JSON.stringify(editFilters)} : s))
    }
  }
  const deleteSearch = async (id) => {
    await fetch(`/api/saved_searches.php?id=${id}`, { method: 'DELETE' }).then(r => r.json())
    setSaved(list => list.filter(s => s.id !== id))
  }
  const applySearch = (s) => {
    const f = typeof s.filters === 'string' ? JSON.parse(s.filters || '{}') : s.filters
    onApply({...f, _savedSearchId: s.id, _savedSearchName: s.name})
    setOpen(false)
  }

  return (
    <div style={{marginBottom:'1rem'}}>
      <button onClick={() => setOpen(!open)} style={{background:'#161b22',color:'#8b949e',border:'1px solid #30363d',padding:'.5rem 1rem',borderRadius:6,cursor:'pointer',fontSize:'.9rem'}}>
        ▼ Saved Searches ({saved.length})
      </button>
      {open && (
        <div style={{marginTop:'.5rem',background:'#161b22',border:'1px solid #30363d',borderRadius:8,padding:'.7rem',maxWidth:520}}>
          {saved.map(s => (
            <div key={s.id} style={{padding:'.5rem 0',borderBottom:'1px solid #21262d'}}>
              {editingId === s.id ? (
                <div style={{display:'flex',flexDirection:'column',gap:'.4rem'}}>
                  <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder='Search name' style={{background:'#0d1117',color:'#e6edf3',border:'1px solid #30363d',borderRadius:6,padding:'.4rem .7rem',fontSize:'.85rem'}} />
                  <Filters defaults={editFilters} onSearch={setEditFilters} compact />
                  <div style={{display:'flex',gap:'.4rem'}}>
                    <button onClick={saveEdit} style={{background:'#238636',color:'#fff',border:'none',borderRadius:6,padding:'.3rem .7rem',cursor:'pointer',fontSize:'.75rem'}}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{background:'#30363d',color:'#e6edf3',border:'none',borderRadius:6,padding:'.3rem .7rem',cursor:'pointer',fontSize:'.75rem'}}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'.5rem',flexWrap:'wrap'}}>
                  <div style={{flex:1,minWidth:140}}>
                    <div style={{fontWeight:600,color:'#e6edf3',fontSize:'.85rem'}}>{s.name}</div>
                    <div style={{fontSize:'.7rem',opacity:.55,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{typeof s.filters === 'string' ? s.filters : JSON.stringify(s.filters)}</div>
                  </div>
                  <div style={{display:'flex',gap:'.25rem'}}>
                    <button onClick={() => applySearch(s)} style={{background:'#238636',color:'#fff',border:'none',borderRadius:6,padding:'.3rem .6rem',cursor:'pointer',fontSize:'.75rem'}}>Apply</button>
                    <button onClick={() => startEdit(s)} style={{background:'#1f6feb',color:'#fff',border:'none',borderRadius:6,padding:'.3rem .6rem',cursor:'pointer',fontSize:'.75rem'}}>Edit</button>
                    <button onClick={() => deleteSearch(s.id)} style={{background:'#f85149',color:'#fff',border:'none',borderRadius:6,padding:'.3rem .6rem',cursor:'pointer',fontSize:'.75rem'}}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
      {row.price_per_sqft && row.sqft > 0 && <div style={{fontSize:'.78rem',color:'#3fb950',marginTop:'.4rem'}}>${Math.round(+row.price_per_sqft).toLocaleString()}/sqft</div>}
      {row.price_per_acre && row.lot_size_sqft > 0 && <div style={{fontSize:'.78rem',color:'#3fb950',marginTop:'.4rem'}}>${Math.round(+row.price_per_acre * 43560).toLocaleString()}/acre</div>}
      {(row.garage_spaces || row.stories || row.year_built) && (
        <div style={{fontSize:'.75rem',color:'#8b949e',marginTop:'.35rem',display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
          {row.garage_spaces ? <span>🚗 {row.garage_spaces} garage</span> : null}
          {row.stories ? <span>{+row.stories <= 1 ? '1-story' : (row.stories + '-story')}</span> : null}
          {row.year_built ? <span>built {row.year_built}</span> : null}
        </div>
      )}
      {row.homestead_score != null && (
        <div style={{fontSize:'.78rem',color:'#58a6ff',marginTop:'.4rem'}}>🏡 Homestead score: <strong>{row.homestead_score}</strong>/100</div>
      )}
      <div style={{marginTop:'.6rem'}}>
        <Link to={`/listing/${row.id}`} style={{fontSize:'.8rem'}}>View history & details →</Link>
      </div>
    </div>
  )
}

/* ── Smart Presets — one-click value searches ── */
const PRESETS = [
  { key:'best_value', label:'Best Value', emoji:'💰', desc:'Lowest $/sqft' },
  { key:'budget', label:'Under $150k', emoji:'💵', desc:'Cheap listings', },
  { key:'family_starter', label:'Family Starter', emoji:'👪', desc:'3+ beds under $350k', },
  { key:'acreage', label:'1+ Acre Under $500k', emoji:'🌲', desc:'Land-friendly', },
  { key:'big_land', label:'10+ Acres', emoji:'🏞️', desc:'Rural / farm', },
  { key:'fixer', label:'Fixer-Upper', emoji:'🔧', desc:'Under $100k with sqft', },
  { key:'price_drop', label:'Price Drop', emoji:'📉', desc:'Recent price cut', },
]
function Presets({ onSelect }) {
  return (
    <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',marginBottom:'1rem'}}>
      {PRESETS.map(p => (
        <button
          key={p.key}
          onClick={() => onSelect({ preset: p.key, page:'1' })}
          style={{background:'#161b22',color:'#e6edf3',border:'1px solid #30363d',borderRadius:6,padding:'.4rem .7rem',cursor:'pointer',fontSize:'.82rem',display:'flex',alignItems:'center',gap:'.3rem'}}
          title={p.desc}
        >
          <span>{p.emoji}</span>
          <span>{p.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ── Special searches — 2026 homestead hunt (scored, region-filtered) ── */
const SPECIAL = [
  { key:'homestead', label:'Homestead Hunt', emoji:'🏡', desc:'Best 1-5+ acre retirement properties across all 6 regions, scored by land value + house + $/acre' },
  { key:'n_clark', label:'N. Clark WA', emoji:'🌲', desc:'Battle Ground, Ridgefield, Yacolt, Amboy, La Center + rural Clark County' },
  { key:'cowlitz', label:'Cowlitz WA', emoji:'🌋', desc:'Woodland, Kalama, Castle Rock, Longview, Kelso, Toutle + rural Cowlitz' },
  { key:'lewis', label:'Lewis WA', emoji:'🏔️', desc:'Centralia, Chehalis, Winlock, Toledo, Mossyrock + rural Lewis County' },
  { key:'salem', label:'Salem OR', emoji:'🍇', desc:'Dallas, Monmouth, Independence, Turner, Aumsville, Silverton outskirts' },
  { key:'albany', label:'Albany OR', emoji:'🌾', desc:'Albany, Lebanon, Philomath, Tangent, Brownsville, Scio + rural Linn-Benton' },
  { key:'sleeper', label:'Sleeper Towns', emoji:'🌙', desc:'Halsey, Harrisburg, Brownsville, Cottage Grove, Vernonia + WA sleepers' },
]
function SpecialSearches({ onSelect }) {
  return (
    <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',marginBottom:'1rem'}}>
      {SPECIAL.map(p => (
        <button
          key={p.key}
          onClick={() => onSelect({ special: p.key, page:'1' })}
          style={{background:'#1f6feb22',color:'#58a6ff',border:'1px solid #1f6feb',borderRadius:6,padding:'.4rem .7rem',cursor:'pointer',fontSize:'.82rem',display:'flex',alignItems:'center',gap:'.3rem'}}
          title={p.desc}
        >
          <span>{p.emoji}</span>
          <span>{p.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ── Browse route ── */
function Browse() {
  const [sp, setSp] = useSearchParams()
  const [filters, setFilters] = useState(Object.fromEntries([...sp.entries()]))
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [scraping, setScraping] = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState('')

  const page = parseInt(filters.page || '1', 10)
  const isPreset = !!filters.preset
  const isSpecial = !!filters.special
  const safeAreaFromSettings = typeof filters.safe_area !== 'undefined' ? filters.safe_area : '0'
  const baseQuery = isSpecial
    ? new URLSearchParams({ type: filters.special, page: String(page), per_page: '24' }).toString()
    : isPreset
    ? new URLSearchParams({ type: filters.preset, page: String(page), per_page: '24', safe_area: safeAreaFromSettings }).toString()
    : new URLSearchParams({ ...filters, page: String(page), safe_area: safeAreaFromSettings }).toString()
  const endpoint = isSpecial ? `/api/special_search.php?${baseQuery}` : isPreset ? `/api/preset_search.php?${baseQuery}` : `/api/listings.php?${baseQuery}`

  const loadListings = () => {
    setData(null)
    fetchJSON(endpoint).then(d => setData(d))
  }

  useEffect(() => { fetchJSON('/api/stats.php').then(d => setStats(d)) }, [])
  useEffect(() => { loadListings() }, [endpoint])
  useEffect(() => { setSp(new URLSearchParams(filters), {replace:true}) }, [filters])

  const doScrape = async () => {
    if (!filters.city || !filters.state) { setScrapeMsg('Select a city and state first'); return }
    setScraping(true)
    setScrapeMsg('Scraping...')
    try {
      const r = await fetch(`/api/scrape_now.php?city=${encodeURIComponent(filters.city)}&state=${encodeURIComponent(filters.state)}`)
      const d = await r.json()
      if (d.ok) {
        setScrapeMsg(`Done — ${d.new} new, ${d.updated} updated`)
        loadListings()
      } else {
        setScrapeMsg('Failed: ' + (d.error || 'unknown'))
      }
    } catch (e) { setScrapeMsg('Failed') }
    setScraping(false)
  }

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
        {filters.preset && <span style={{background:'#1f6feb',padding:'.4rem .8rem',borderRadius:6,border:'1px solid #1f6feb',color:'#fff'}}>Preset: {filters.preset.replace(/_/g,' ')} <button onClick={()=>setFilters({...filters, preset:''})} style={{background:'transparent',color:'#fff',border:'none',cursor:'pointer',marginLeft:'.4rem'}}>✕</button></span>}
        {filters.special && <span style={{background:'#1f6feb',padding:'.4rem .8rem',borderRadius:6,border:'1px solid #1f6feb',color:'#fff'}}>🔎 {SPECIAL.find(s=>s.key===filters.special)?.label || filters.special} <button onClick={()=>setFilters({...filters, special:''})} style={{background:'transparent',color:'#fff',border:'none',cursor:'pointer',marginLeft:'.4rem'}}>✕</button></span>}
        {filters._savedSearchName && <span style={{background:'#238636',padding:'.4rem .8rem',borderRadius:6,border:'1px solid #238636',color:'#fff'}}>Saved: {filters._savedSearchName} <button onClick={()=>{const n={...filters}; delete n._savedSearchId; delete n._savedSearchName; setFilters(n)}} style={{background:'transparent',color:'#fff',border:'none',cursor:'pointer',marginLeft:'.4rem'}}>✕</button></span>}
      </div>
      <Filters defaults={filters} onSearch={setFilters} />
      <Presets onSelect={setFilters} />
      <SpecialSearches onSelect={setFilters} />
      <SavedSearches onApply={setFilters} />
      <SaveSearchButton filters={filters} />
      <div style={{display:'flex',gap:'.5rem',alignItems:'center',marginBottom:'1rem'}}>
        <button onClick={doScrape} disabled={scraping} style={{background:'#1f6feb',color:'#fff',border:'none',borderRadius:6,padding:'.4rem .8rem',cursor:'pointer',fontSize:'.85rem',opacity:scraping?.5:1}}>
          {scraping ? '⏳ Scraping...' : '🔍 Scrape now'}
        </button>
        {scrapeMsg && <span style={{fontSize:'.85rem',color:'#8b949e'}}>{scrapeMsg}</span>}
      </div>
      <button onClick={exportCSV} style={{marginBottom:'1rem'}}>Export CSV</button>
      {data?.type && <span style={{fontSize:'.85rem',color:'#1f6feb',marginBottom:'1rem',display:'block'}}>🔎 Smart search: {data.type.replace(/_/g,' ')}</span>}
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
  const [results, setResults] = useState(null)
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
    // Also clear previous results so the button re-appears
    setResults(null)
  }

  const searchArea = () => {
    if (!searchBounds) return
    const sw = searchBounds.getSouthWest()
    const ne = searchBounds.getNorthEast()
    const q = new URLSearchParams({
      lat_min: String(sw.lat),
      lat_max: String(ne.lat),
      lng_min: String(sw.lng),
      lng_max: String(ne.lng),
      per_page: '50',
      sort: 'price_asc',
    }).toString()
    fetchJSON(`/api/listings.php?${q}`).then(d => setResults(d))
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
        {hasMoved && !results ? (
          <button style={{padding:'.4rem .8rem',borderRadius:6,border:'1px solid #238636',background:'#238636',color:'#fff',cursor:'pointer'}}
            onClick={searchArea}>
            🔍 Search this area ({boundsCount})
          </button>
        ) : null}
        {results && (
          <button style={{padding:'.4rem .8rem',borderRadius:6,border:'1px solid #30363d',background:'#161b22',color:'#8b949e',cursor:'pointer'}}
            onClick={() => { setResults(null); setHasMoved(false); }}>
            Reset
          </button>
        )}
        <span style={{color:'#8b949e',fontSize:'.85rem',marginLeft:'auto'}}>
          {results ? `${results.total} listings found` : 'Pan the map to search a specific area'}
        </span>
      </div>

      <div style={{height:'50vh',border:'1px solid #30363d',borderRadius:8,overflow:'hidden',marginBottom:'1rem'}}>
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

      {results && (
        <div>
          <h3 style={{color:'#e6edf3',marginBottom:'.5rem'}}>Results in this area ({results.total})</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
            {results.listings.map(row => (
              <div key={row.id} className='card' style={{padding:'1rem'}}>
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
            ))}
          </div>
          {results.pages > 1 && (
            <div style={{marginTop:'1.5rem',display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
              {Array.from({length:results.pages}, (_,i)=>i+1).map(p => (
                <span key={p} style={{background:p===results.page?'#238636':'transparent',color:p===results.page?'#fff':'#8b949e',padding:'.3rem .6rem',borderRadius:4}}>{p}</span>
              ))}
            </div>
          )}
        </div>
      )}
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

/* ── Rentals page ── */
function Rentals() {
  const [sp, setSp] = useSearchParams()
  const [filters, setFilters] = useState(Object.fromEntries([...sp.entries()]))
  const [data, setData] = useState(null)
  const page = parseInt(filters.page || '1', 10)
  const baseQuery = new URLSearchParams({ ...filters, page: String(page), per_page: '24', listing_type: 'rental' }).toString()
  const endpoint = `/api/listings.php?${baseQuery}`
  useEffect(() => { fetchJSON(endpoint).then(d => setData(d)) }, [endpoint])
  useEffect(() => { setSp(new URLSearchParams(filters), {replace:true}) }, [filters])
  return (
    <div className='wrap'>
      <h2 style={{ margin: '1rem 0', color: '#58a6ff' }}>Home Rentals</h2>
      <Filters defaults={filters} onSearch={setFilters} />
      {!data ? <p style={{opacity:.5}}>Loading rentals...</p> : (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
            {data.listings.map(row => <Card key={row.id} row={row} favIds={new Set()} onToggleFav={()=>{}} />)}
          </div>
          {data.pages > 1 && (
            <div style={{marginTop:'1.5rem',display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
              {Array.from({length:data.pages}, (_,i)=>i+1).map(p => (
                <button key={p} style={{minWidth:30,padding:'.3rem .6rem'}} onClick={()=>setFilters({...filters, page:String(p)})}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
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
        <Route path='/rentals' element={<Rentals/>} />
        <Route path='/settings' element={<SettingsPage/>} />
      </Routes>
    </Layout>
  )
}
