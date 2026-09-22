import React, { useEffect, useState } from 'react'

function fetchJSON(path, opts) { return fetch(path, opts).then(r => r.json()) }

export default function Filters({ defaults, onSearch }) {
  const [state, setState] = useState(defaults)
  const [opts, setOpts] = useState({ cities: [], states: [], counties: [] })
  useEffect(() => { fetchJSON('/api/filters.php' + (state.state ? '?state=' + encodeURIComponent(state.state) : '')).then(d => setOpts(d)) }, [state.state, state.county])
  useEffect(() => { setState(defaults) }, [defaults])

  const submit = e => { e.preventDefault(); onSearch(state) }
  const clear = () => {
    const preserved = { ...state }
    delete preserved.county
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
          <select value={state.state||''} onChange={e=>{ const v=e.target.value; setState({...state, state:v, county:'', city:''}) }}>
            <option value=''>Any</option>
            {opts.states.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        {state.state && (
          <label>County
            <select value={state.county||''} onChange={e=>{ const v=e.target.value; setState({...state, county:v, city:''}) }}>
              <option value=''>Any</option>
              {opts.counties.map(c=> <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        )}
        <label>City
          <input list='cities' type='text' value={state.city||''} placeholder='Type city...' onChange={e=>setState({...state, city:e.target.value})} />
          <datalist id='cities'>
            {opts.cities.map(c=> <option key={c} value={c} />)}
          </datalist>
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
