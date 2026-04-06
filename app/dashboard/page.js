'use client';
import { useState } from 'react';

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const buscarDatos = async () => {
    if (!email.trim()) return;
    setCargando(true);
    setError(null);

    try {
      const res = await fetch(
        `https://khinwyoejhoqqunfyjft.supabase.co/rest/v1/tests?email=eq.${encodeURIComponent(email)}&order=fecha.asc`,
        {
          headers: {
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaW53eW9lamhvcXF1bmZ5amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjgxMzksImV4cCI6MjA5MDc0NDEzOX0.CE8EzbHQLdKN9Ag0nZVGS3gHPOc4NK464RyLtrP_nYM',
          },
        }
      );
      const tests = await res.json();
      if (tests.length === 0) {
        setError('No encontramos ningún test con ese email. ¿Has hecho el test antes?');
      } else {
        setDatos(tests);
      }
    } catch {
      setError('Error al conectar. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const ultimo = datos?.[datos.length - 1];
  const anterior = datos?.[datos.length - 2];
  const deltaICM = anterior ? (ultimo?.icm_total - anterior?.icm_total).toFixed(1) : null;

  const categoriaColor = (icm) => {
    if (icm >= 80) return '#5B9B3C';
    if (icm >= 65) return '#8DC96B';
    if (icm >= 50) return '#E8A020';
    return '#E8621A';
  };

  const scoreColor = (score) => {
    if (score >= 70) return '#5B9B3C';
    if (score >= 50) return '#E8A020';
    return '#E8621A';
  };

  const formatFecha = (f) => {
    const d = new Date(f);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Calcular posiciones del gráfico
  const chartData = datos?.map((t, i) => ({
    x: datos.length === 1 ? 50 : (i / (datos.length - 1)) * 80 + 10,
    y: 90 - ((t.icm_total / 100) * 70),
    icm: t.icm_total,
    fecha: formatFecha(t.fecha),
  }));

  const pathD = chartData?.length > 1
    ? chartData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 6.8} ${p.y * 1.1}`).join(' ')
    : null;

  const areaD = pathD
    ? `${pathD} L ${chartData[chartData.length - 1].x * 6.8} 110 L ${chartData[0].x * 6.8} 110 Z`
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F4EE',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
    }}>

      {/* Header */}
      <div style={{ background: '#E8621A', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontSize: '20px' }}>🧬</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#fff' }}>
          test<span style={{ color: '#FDF0E8' }}>metabólico</span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', textDecoration: 'none' }}>← Hacer nuevo test</a>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px' }}>

        {/* Login por email */}
        {!datos && (
          <div style={{ textAlign: 'center', paddingTop: '40px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', color: '#1E1E1A', marginBottom: '8px' }}>
              Tu evolución <span style={{ color: '#E8621A', fontStyle: 'italic' }}>metabólica</span>
            </h1>
            <p style={{ fontSize: '14px', color: '#6B6860', marginBottom: '32px', lineHeight: '1.7' }}>
              Introduce el email con el que hiciste el test para ver tu historial completo.
            </p>
            <div style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarDatos()}
                placeholder="tu@email.com"
                style={{
                  flex: 1, padding: '12px 18px',
                  border: '1.5px solid #E0DBD0', borderRadius: '100px',
                  fontSize: '14px', background: '#fff',
                  fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                  outline: 'none', color: '#1E1E1A',
                }}
              />
              <button
                onClick={buscarDatos}
                disabled={cargando}
                style={{
                  background: '#E8621A', color: '#fff',
                  border: 'none', padding: '12px 22px',
                  borderRadius: '100px', fontSize: '13px',
                  fontWeight: '600', cursor: 'pointer',
                  fontFamily: 'Trebuchet MS, Verdana, sans-serif',
                }}
              >
                {cargando ? '...' : 'Ver →'}
              </button>
            </div>
            {error && (
              <p style={{ color: '#E8621A', fontSize: '13px', marginTop: '16px' }}>{error}</p>
            )}
          </div>
        )}

        {/* Dashboard con datos */}
        {datos && ultimo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Saludo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#9A9790', marginBottom: '2px' }}>
                  {datos.length} test{datos.length > 1 ? 's' : ''} completado{datos.length > 1 ? 's' : ''}
                </div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#1E1E1A' }}>
                  Tu evolución metabólica
                </h2>
              </div>
              <button
                onClick={() => { setDatos(null); setEmail(''); }}
                style={{ fontSize: '11px', color: '#9A9790', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Cambiar email
              </button>
            </div>

            {/* Banner ICM actual */}
            <div style={{
              background: '#E8621A', borderRadius: '16px', padding: '24px',
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>ICM actual</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '52px', color: '#fff', lineHeight: '1' }}>{ultimo.icm_total}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>/100</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Edad metabólica</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '52px', color: '#fff', lineHeight: '1' }}>{ultimo.edad_metabolica}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>años</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  {deltaICM ? 'Evolución' : 'Último test'}
                </div>
                {deltaICM ? (
                  <>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '52px', color: '#fff', lineHeight: '1' }}>
                      {deltaICM > 0 ? '+' : ''}{deltaICM}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>puntos vs anterior</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#fff', lineHeight: '1', marginTop: '14px' }}>{formatFecha(ultimo.fecha)}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '8px' }}>Haz el 2º test para ver evolución</div>
                  </>
                )}
              </div>
            </div>

            {/* Gráfico evolución */}
            {datos.length > 1 && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E0DBD0' }}>
                <div style={{ fontSize: '11px', color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Evolución del ICM</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1E1E1A', marginBottom: '16px' }}>
                  Progreso mensual
                </div>
                <svg viewBox="0 0 680 110" style={{ width: '100%', height: '120px' }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5B9B3C" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#5B9B3C" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[20, 55, 90].map(y => (
                    <line key={y} x1="40" y1={y} x2="660" y2={y} stroke="#E0DBD0" strokeWidth="0.5"/>
                  ))}
                  {/* Area */}
                  {areaD && <path d={areaD} fill="url(#areaGrad)"/>}
                  {/* Línea */}
                  {pathD && <path d={pathD} fill="none" stroke="#5B9B3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}
                  {/* Puntos */}
                  {chartData.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x * 6.8} cy={p.y * 1.1} r="5" fill={i === chartData.length - 1 ? '#E8621A' : '#5B9B3C'} stroke="#fff" strokeWidth="2"/>
                      <text x={p.x * 6.8} y={p.y * 1.1 - 10} textAnchor="middle" fontSize="10" fill={i === chartData.length - 1 ? '#E8621A' : '#5B9B3C'} fontWeight="600">{p.icm}</text>
                    </g>
                  ))}
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9A9790', marginTop: '4px' }}>
                  {chartData.map((p, i) => (
                    <span key={i} style={{ color: i === chartData.length - 1 ? '#E8621A' : '#9A9790', fontWeight: i === chartData.length - 1 ? '600' : '400' }}>
                      {p.fecha}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Scores último test */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E0DBD0' }}>
              <div style={{ fontSize: '11px', color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Último test · {formatFecha(ultimo.fecha)}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1E1E1A', marginBottom: '16px' }}>Desglose por bloque</div>
              {[
                { nombre: '⚡ Actividad física', valor: ultimo.efh_score, key: 'efh' },
                { nombre: '🏋️ Composición corporal', valor: ultimo.eco_score, key: 'eco' },
                { nombre: '🥗 Nutrición', valor: ultimo.nut_score, key: 'nut' },
                { nombre: '😴 Descanso', valor: ultimo.des_score, key: 'des' },
                { nombre: '🧠 Vitalidad', valor: ultimo.vit_score, key: 'vit' },
              ].map(s => (
                <div key={s.key} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#1E1E1A' }}>{s.nombre}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: scoreColor(s.valor) }}>{s.valor}/100</span>
                  </div>
                  <div style={{ height: '6px', background: '#EDE9E0', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.valor}%`, background: scoreColor(s.valor), borderRadius: '100px', transition: 'width 0.8s ease' }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Historial de tests */}
            {datos.length > 1 && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E0DBD0' }}>
                <div style={{ fontSize: '11px', color: '#9A9790', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Historial</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1E1E1A', marginBottom: '16px' }}>Todos tus tests</div>
                {[...datos].reverse().map((t, i) => (
                  <div key={t.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: i < datos.length - 1 ? '1px solid #EDE9E0' : 'none'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#1E1E1A', fontWeight: i === 0 ? '600' : '400' }}>
                        {formatFecha(t.fecha)} {i === 0 && <span style={{ fontSize: '10px', background: '#EBF5E4', color: '#5B9B3C', padding: '1px 8px', borderRadius: '100px', marginLeft: '6px' }}>Último</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9A9790', marginTop: '2px' }}>Edad metabólica: {t.edad_metabolica} años</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: categoriaColor(t.icm_total) }}>{t.icm_total}</div>
                      <div style={{ fontSize: '10px', color: '#9A9790' }}>ICM</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA primer test si solo hay uno */}
            {datos.length === 1 && (
              <div style={{ background: '#EBF5E4', border: '1px solid #C8E8B0', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#1E1E1A', marginBottom: '6px' }}>Vuelve en 30 días</div>
                <div style={{ fontSize: '13px', color: '#6B6860', lineHeight: '1.6', marginBottom: '16px' }}>
                  Cuando hagas tu segundo test verás aquí tu evolución y el gráfico de progreso del ICM.
                </div>
                <a href="/bot" style={{
                  display: 'inline-block', background: '#5B9B3C', color: '#fff',
                  padding: '10px 24px', borderRadius: '100px', fontSize: '13px',
                  fontWeight: '600', textDecoration: 'none'
                }}>
                  Hacer nuevo test →
                </a>
              </div>
            )}

            {/* CTA suscripción */}
            <div style={{ background: '#E8621A', borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#fff', marginBottom: '4px' }}>
                  Sigue tu evolución cada mes
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>9,90€/mes · Cancela cuando quieras</div>
              </div>
              <a href="#" style={{
                background: '#fff', color: '#E8621A',
                padding: '10px 22px', borderRadius: '100px',
                fontSize: '12px', fontWeight: '600', textDecoration: 'none'
              }}>
                Activar suscripción →
              </a>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}