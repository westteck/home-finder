import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useSearchParams, useParams } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
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
        </nav>
      </header>
      <main style={{padding:'1rem 1.5rem'}}>{children}</main>
    </>
  )
}

/* ── Filters component ── */
function Filters({ state, set }) {
  const [opts, setOpts] = useState({ cities: [], states: [] })
  useEffect(() => { fetchJSON('/api/filters.php').then(d => setOpts(d)) }, [])
  return (
    <form style={{display:'flex',flexWrap:'wrap',gap:'.6rem 1rem',marginBottom:'1.2rem',padding:'.9rem',background:'#161b22',border:'1px solid #30363d',borderRadius:'8px',alignItems:'flex-end'}} onSubmit={e => e.preventDefault()}>
      <label>Min $<input type='number' value={state.min_price || ''} onChange={e=>set({...state, min_price:e.target.value})} /></label>
      <label>Max $<input type='number' value={state.max_price || ''} onChange={e=>set({...state, max_price:e.target.value})} /></label>
      <label>Beds ≥<input type='number' step='0.5' value={state.min_beds || ''} onChange={e=>set({...state, min_beds:e.target.value})} /></label>
      <label>Baths ≥<input type='number' step='0.5' value={state.min_baths || ''} onChange={e=>set({...state, min_baths:e.target.value})} /></label>
      <label>Lot(ac) ≥<input type='number' step='0.5' value={state.min_lot || ''} onChange={e=>set({...state, min_lot:e.target.value})} /></label>
      <label>State
        <select value={state.state||''} onChange={e=>set({...state, state:e.target.value})}>
          <option value=''>Any</option>
          {opts.states.map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>City
        <select value={state.city||''} onChange={e=>set({...state, city:e.target.value})}>
          <option value=''>Any</option>
          {opts.cities.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label>Search<input type='text' value={state.q||''} placeholder='address, zip...' onChange={e=>set({...state, q:e.target.value})} /></label>
      <label>Sort
        <select value={state.sort||'price_asc'} onChange={e=>set({...state, sort:e.target.value})}>
          <option value='price_asc'>Price ▲</option>
          <option value='price_desc'>Price ▼</option>
          <option value='beds_desc'>Beds ▼</option>
          <option value='lot_desc'>Lot ▼</option>
          <option value='newest'>Newest</option>
        </select>
      </label>
      <button onClick={()=>set({})}>Clear</button>
    </form>
  )
}

/* ── Card ── */
function Card({ row }) {
  const photo = row.photo_url || null
  const lat = parseFloat(row.latitude)
  const lng = parseFloat(row.longitude)
  return (
    <div className='card'>
      <a href={row.url} target='_blank' rel='noreferrer'>
        {photo ? (
          <div style={{height:200,backgroundSize:'cover',backgroundPosition:'center',backgroundImage:`url(${photo})`,position:'relative'}}>
            <span style={{position:'absolute',bottom:'.5rem',left:'.5rem',background:'rgba(13,17,23,.9)',padding:'.3rem .6rem',borderRadius:4,fontWeight:600,color:'#3fb950'}}>${(+row.price).toLocaleString()}</span>
            <span style={{position:'absolute',top:'.5rem',right:'.5rem',background:'rgba(13,17,23,.9)',padding:'.15rem .5rem',borderRadius:4,fontSize:'.7rem',textTransform:'uppercase'}}>{row.status}</span>
          </div>
        ) : (
          <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:'#484f58',fontSize:'.9rem',position:'relative',background:'#21262d'}}>
            No Photo
            <span style={{position:'absolute',bottom:'.5rem',left:'.5rem',background:'rgba(13,17,23,.9)',padding:'.3rem .6rem',borderRadius:4,fontWeight:600,color:'#3fb950'}}>${(+row.price).toLocaleString()}</span>
          </div>
        )}
      </a>
      <div style={{padding:'.85rem'}}>
        <div style={{fontWeight:600,color:'#e6edf3',fontSize:'.95rem'}}>{row.address}</div>
        <div style={{fontSize:'.8rem',opacity:.65,marginBottom:'.5rem'}}>{row.city}, {row.state} {row.zip}</div>
        <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap',fontSize:'.78rem'}}>
          {row.beds ? <span style={{background:'#21262d',padding:'.1rem .4rem',borderRadius:4}}>{row.beds} bd / {row.baths} ba</span> : null}
          {row.sqft ? <span style={{background:'#21262d',padding:'.1rem .4rem',borderRadius:4}}>{(+row.sqft).toLocaleString()} sqft</span> : null}
          {row.lot_size_sqft ? <span style={{background:'#21262d',padding:'.1rem .4rem',borderRadius:4}}>{(row.lot_size_sqft/43560).toFixed(1)} ac</span> : null}
          <span style={{background:'#1f6feb',color:'#fff',padding:'.1rem .4rem',borderRadius:4}}>{row.source.split('-')[0]}</span>
        </div>
        <div style={{marginTop:'.5rem'}}>
          <Link to={`/listing/${row.id}`} style={{fontSize:'.8rem'}}>View history & details →</Link>
        </div>
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
      <Filters state={filters} set={setFilters} />
      <button onClick={exportCSV} style={{marginBottom:'1rem'}}>Export CSV</button>
      {!data ? <p style={{opacity:.5}}>Loading...</p> : (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
            {data.listings.map(row => <Card key={row.id} row={row} />)}
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
function MapPage() {
  const [rows, setRows] = useState([])
  useEffect(() => {
    fetchJSON('/api/listings.php?per_page=9999').then(d => setRows(d.listings.filter(r => r.latitude && r.longitude)))
  }, [])
  if (!rows.length) return <p style={{padding:'1rem',opacity:.5}}>Loading map...</p>
  const center = [+rows[0].latitude, +rows[0].longitude]
  return (
    <div style={{height:'80vh',border:'1px solid #30363d',borderRadius:8,overflow:'hidden'}}>
      <MapContainer center={center} zoom={6} style={{height:'100%',width:'100%'}}>
        <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
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
          {row.photo_url ? <img src={row.photo_url} alt='' style={{width:'100%',borderRadius:8,border:'1px solid #30363d'}} /> : <div style={{padding:'2rem',background:'#161b22',borderRadius:8,textAlign:'center',color:'#484f58'}}>No Photo</div>}
          <div style={{marginTop:'1rem',fontSize:'.9rem'}}>
            <p><strong>${(+row.price).toLocaleString()}</strong> — {row.status}</p>
            <p>{row.city}, {row.state} {row.zip}</p>
            {row.beds ? <p>{row.beds} bd / {row.baths} ba</p> : null}
            {row.sqft ? <p>{(+row.sqft).toLocaleString()} sqft</p> : null}
            {row.lot_size_sqft ? <p>{(row.lot_size_sqft/43560).toFixed(1)} acres</p> : null}
            <p><a href={row.url} target='_blank' rel='noreferrer'>View on Redfin →</a></p>
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
      </Routes>
    </Layout>
  )
}
