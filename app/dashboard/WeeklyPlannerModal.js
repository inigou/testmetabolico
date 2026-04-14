'use client';
import { useState, useEffect } from 'react';

const C = {
  bg: '#F7F4EE', green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF',
  dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC',
  greenPale: '#EBF5E4', orangePale: '#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_S = ['L','M','X','J','V','S','D'];
const getDiaHoy = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const CAT_ICON = { 'Proteinas':'🥩','Proteínas':'🥩','Verduras':'🥦','Vegetales':'🥦','Hidratos':'🍚','Carbohidratos':'🍚','Grasas':'🫒','Lácteos':'🥛','Lacteos':'🥛','Frutas':'🍎','Otros':'🛒','Especias':'🧂' };

export default function WeeklyPlannerModal({ planSemanal, onCerrar, email, objetivoId }) {
  const [tab, setTab] = useState('semana');
  const [diaAbierto, setDiaAbierto] = useState(getDiaHoy());
  const [checks, setChecks] = useState({});
  const diaHoy = getDiaHoy();

  useEffect(() => {
    if (!email || !objetivoId) return;
    try { const s = localStorage.getItem(`compra_${email}_${objetivoId}`); if (s) setChecks(JSON.parse(s)); } catch(e) {}
  }, [email, objetivoId]);

  const toggle = (cat, item) => {
    const k = `${cat}||${item}`;
    const n = { ...checks, [k]: !checks[k] };
    setChecks(n);
    try { localStorage.setItem(`compra_${email}_${objetivoId}`, JSON.stringify(n)); } catch(e) {}
  };

  const reset = () => { setChecks({}); try { localStorage.removeItem(`compra_${email}_${objetivoId}`); } catch(e) {} };

  const compra = planSemanal?.compra || {};
  const total = Object.values(compra).flat().length;
  const done = Object.values(checks).filter(Boolean).length;
  const pct = total > 0 ? Math.round((done/total)*100) : 0;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={onCerrar} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)' }} />
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:640, height:'90dvh', borderRadius:20, background:C.white, display:'flex', flexDirection:'column', overflow:'hidden', animation:'scaleIn 0.22s ease' }}>
        <style>{`@keyframes scaleIn{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}} @keyframes slideD{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Header */}
        <div style={{ background:C.green, padding:'18px 20px 0', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>
                {tab==='semana' ? 'Vista semanal' : 'Modo supermercado'}
              </div>
              <div style={{ fontFamily:'Georgia, serif', fontSize:20, color:C.white }}>
                {tab==='semana' ? '📅 Plan de la semana' : '🛒 Lista de la compra'}
              </div>
            </div>
            <button onClick={onCerrar} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:C.white, width:34, height:34, borderRadius:'50%', fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {[{id:'semana',label:'📅 Semana'},{id:'compra',label:'🛒 Compra'}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'9px 20px', cursor:'pointer', fontFamily:font, fontSize:12, fontWeight:700, border:'none', background:tab===t.id ? C.white : 'transparent', color:tab===t.id ? C.green : 'rgba(255,255,255,0.8)', borderRadius:'10px 10px 0 0', transition:'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', background:C.bg }}>

          {/* ── SEMANA ── */}
          {tab === 'semana' && (
            <div style={{ padding:16 }}>
              {/* Selector rápido */}
              <div style={{ display:'flex', gap:5, marginBottom:14, background:C.white, padding:10, borderRadius:14, border:`1px solid ${C.light}` }}>
                {DIAS_S.map((d,i) => (
                  <button key={i} onClick={() => setDiaAbierto(i)} style={{ flex:1, padding:'7px 0', borderRadius:8, border:'none', cursor:'pointer', fontFamily:font, fontSize:11, fontWeight:700, background:diaAbierto===i ? C.orange : i===diaHoy ? C.greenPale : 'transparent', color:diaAbierto===i ? C.white : i===diaHoy ? C.green : C.mid, transition:'all 0.15s' }}>
                    {d}
                  </button>
                ))}
              </div>

              {DIAS.map((dia,i) => {
                const dd = planSemanal?.dieta?.[i];
                const ej = planSemanal?.ejercicios?.[i];
                const esHoy = i === diaHoy;
                const open = diaAbierto === i;
                return (
                  <div key={i} style={{ marginBottom:8, borderRadius:14, border:`1.5px solid ${open ? (esHoy ? C.green : C.orange) : C.light}`, overflow:'hidden', background:C.white }}>
                    <button onClick={() => setDiaAbierto(open ? -1 : i)} style={{ width:'100%', textAlign:'left', border:'none', background:open ? (esHoy ? C.greenPale : C.orangePale) : C.white, padding:'13px 16px', cursor:'pointer', fontFamily:font, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:esHoy ? C.green : open ? C.orange : C.light, color:esHoy||open ? C.white : C.mid, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{dia}</span>
                            {esHoy && <span style={{ background:C.green, color:C.white, fontSize:8, fontWeight:700, padding:'2px 7px', borderRadius:100 }}>HOY</span>}
                          </div>
                          {ej && <div style={{ fontSize:10, color:C.green, marginTop:1 }}>🏋️ {ej.tipo}</div>}
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        {!open && <div style={{ display:'flex', gap:2, fontSize:12 }}><span>🌅</span><span>☀️</span><span>🌙</span></div>}
                        <span style={{ color:C.mid, fontSize:13, transform:open?'rotate(180deg)':'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
                      </div>
                    </button>

                    {open && (
                      <div style={{ padding:'12px 16px 16px', animation:'slideD 0.2s ease' }}>
                        {dd && (
                          <div style={{ marginBottom: ej ? 12 : 0 }}>
                            {[
                              { icon:'🌅', label:'Desayuno', val:dd.desayuno },
                              { icon:'☀️', label:'Comida', val:dd.comida },
                              { icon:'🍎', label:'Snack', val:dd.snack },
                              { icon:'🌙', label:'Cena', val:dd.cena },
                            ].filter(c => c.val).map((c,j) => (
                              <div key={j} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
                                <span style={{ fontSize:16, flexShrink:0 }}>{c.icon}</span>
                                <div>
                                  <div style={{ fontSize:9, color:C.orange, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{c.label}</div>
                                  <div style={{ fontSize:12, color:C.dark, lineHeight:1.5 }}>{c.val}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {ej && (
                          <div style={{ background:C.greenPale, borderRadius:10, padding:'10px 12px', border:'1px solid #C8E8B0' }}>
                            <div style={{ fontSize:10, color:C.green, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>🏋️ {ej.tipo}</div>
                            {ej.ejercicios?.map((e,j) => (
                              <div key={j} style={{ fontSize:11, color:C.dark, display:'flex', gap:6, marginBottom:3 }}><span style={{ color:C.green }}>▸</span><span>{e}</span></div>
                            ))}
                          </div>
                        )}
                        {!dd && !ej && <div style={{ fontSize:12, color:C.mid, fontStyle:'italic' }}>Sin datos para este día</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── COMPRA ── */}
          {tab === 'compra' && (
            <div style={{ padding:16 }}>
              {/* Progreso */}
              <div style={{ background:C.white, borderRadius:14, padding:'14px 16px', marginBottom:14, border:`1px solid ${C.light}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.dark }}>{pct===100 ? '🎉 ¡Carrito completo!' : `${done} de ${total} productos`}</div>
                    <div style={{ fontSize:11, color:C.mid, marginTop:2 }}>{pct===100 ? 'Todo listo para la semana' : `${total-done} pendientes`}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'Georgia, serif', fontSize:28, color:pct===100 ? C.green : C.orange }}>{pct}%</div>
                    <button onClick={reset} style={{ background:'none', border:'none', fontSize:10, color:C.mid, cursor:'pointer', fontFamily:font, textDecoration:'underline' }}>Resetear</button>
                  </div>
                </div>
                <div style={{ height:8, background:C.light, borderRadius:100, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:pct===100 ? C.green : C.orange, borderRadius:100, transition:'width 0.4s ease' }} />
                </div>
              </div>

              {Object.keys(compra).length === 0 && (
                <div style={{ textAlign:'center', padding:'40px 0' }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>🛒</div>
                  <div style={{ fontSize:13, color:C.mid }}>Genera el plan semanal para ver la lista de la compra.</div>
                </div>
              )}

              {Object.entries(compra).map(([cat, items]) => {
                const arr = Array.isArray(items) ? items : [];
                const catDone = arr.filter(item => checks[`${cat}||${item}`]).length;
                const allDone = catDone === arr.length && arr.length > 0;
                return (
                  <div key={cat} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:18 }}>{CAT_ICON[cat] || '🛒'}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:C.dark, textTransform:'uppercase', letterSpacing:'0.06em' }}>{cat}</span>
                      <div style={{ flex:1, height:1, background:C.light }} />
                      <span style={{ fontSize:10, color:allDone ? C.green : C.mid, fontWeight:allDone ? 700 : 400 }}>{catDone}/{arr.length}{allDone ? ' ✓' : ''}</span>
                    </div>
                    <div style={{ background:C.white, borderRadius:12, border:`1px solid ${C.light}`, overflow:'hidden' }}>
                      {arr.map((item, j) => {
                        const checked = !!checks[`${cat}||${item}`];
                        return (
                          <button key={j} onClick={() => toggle(cat, item)} style={{ width:'100%', textAlign:'left', fontFamily:font, padding:'13px 14px', background:checked ? '#F8FDF5' : C.white, border:'none', borderBottom:j<arr.length-1 ? `1px solid ${C.light}` : 'none', cursor:'pointer', display:'flex', alignItems:'center', gap:12, transition:'background 0.15s' }}>
                            <div style={{ width:24, height:24, borderRadius:7, flexShrink:0, border:`2px solid ${checked ? C.green : C.light}`, background:checked ? C.green : C.white, display:'flex', alignItems:'center', justifyContent:'center', color:C.white, fontSize:13, fontWeight:700, transition:'all 0.2s' }}>
                              {checked ? '✓' : ''}
                            </div>
                            <span style={{ fontSize:13, color:checked ? C.mid : C.dark, textDecoration:checked ? 'line-through' : 'none', textDecorationColor:'#C0B8B0', flex:1 }}>{item}</span>
                            {checked && <span style={{ fontSize:13 }}>✅</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {Object.keys(compra).length > 0 && (
                <div style={{ background:C.orangePale, border:'1px solid #F9CFA8', borderRadius:12, padding:'12px 14px', textAlign:'center', marginTop:4 }}>
                  <div style={{ fontSize:12, color:C.mid, lineHeight:1.6 }}>💡 Lista generada y adaptada a tu objetivo. Toca para marcar como comprado.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}