'use client';

// ─────────────────────────────────────────────────────────────────────
// LiveCalorieBudget
// Muestra en tiempo real: Presupuesto - Consumido = Balance
//
// Fuente de datos:
//   · presupuesto = viene del Drawer (Centro de Mando / Plantilla Base)
//     → BMR + pasos habituales + entreno habitual + gasto extra del día
//   · consumido   = suma de kcal de las tareas marcadas con ✓
//   · balance     = presupuesto - consumido
//
// Props:
//   presupuesto       {number}  kcal objetivo del día (desde config base)
//   kcalConsumidas    {number}  suma de kcal de checks completados
//   gastoExtra        {number}  delta de actividad extra (Quick Add / adaptar)
// ─────────────────────────────────────────────────────────────────────

const C = {
  bg: '#F7F4EE', green: '#5B9B3C', orange: '#E8621A', white: '#FFFFFF',
  dark: '#1A1A1A', mid: '#6B6B6B', light: '#E8E4DC',
  greenPale: '#EBF5E4', orangePale: '#FDF0E8',
};
const font = 'Trebuchet MS, Verdana, sans-serif';

function balanceColor(balance, presupuesto) {
  if (presupuesto === 0) return C.mid;
  const pct = balance / presupuesto;
  if (pct > 0.25)  return C.green;   // mucho margen — verde
  if (pct > 0)     return '#F9A825'; // poco margen — amarillo
  if (pct > -0.1)  return C.orange;  // ligero exceso — naranja
  return '#C62828';                  // exceso claro — rojo
}

function balanceLabel(balance) {
  if (balance > 400)  return 'Margen amplio';
  if (balance > 100)  return 'En objetivo';
  if (balance > 0)    return 'Ajustado';
  if (balance > -200) return 'Leve exceso';
  return 'Exceso calórico';
}

export default function LiveCalorieBudget({ presupuesto = 0, kcalConsumidas = 0, gastoExtra = 0 }) {
  const presupuestoTotal = presupuesto + gastoExtra;
  const balance = presupuestoTotal - kcalConsumidas;
  const pctConsumido = presupuestoTotal > 0
    ? Math.min(100, Math.round((kcalConsumidas / presupuestoTotal) * 100))
    : 0;
  const color = balanceColor(balance, presupuestoTotal);
  const label = balanceLabel(balance);

  if (presupuesto === 0) {
    // Sin config de plantilla base — mostrar aviso suave
    return (
      <div style={{ background: C.white, borderRadius: 12, padding: '10px 14px', border: `1px solid ${C.light}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.4 }}>
          Configura tu plantilla base en <strong>⚙️</strong> para ver el presupuesto calórico en vivo
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.white, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.light}` }}>
      {/* Fila principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        {/* Consumido */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Consumido</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.orange, lineHeight: 1 }}>{kcalConsumidas}</div>
          <div style={{ fontSize: 8, color: C.mid, marginTop: 1 }}>kcal</div>
        </div>

        <div style={{ fontSize: 14, color: C.light, paddingTop: 12 }}>/</div>

        {/* Presupuesto */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
            Presupuesto
            {gastoExtra !== 0 && (
              <span style={{ marginLeft: 4, color: gastoExtra > 0 ? '#7B1FA2' : C.orange, fontSize: 8 }}>
                {gastoExtra > 0 ? `+${gastoExtra}` : gastoExtra} extra
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.dark, lineHeight: 1 }}>{presupuestoTotal}</div>
          <div style={{ fontSize: 8, color: C.mid, marginTop: 1 }}>kcal</div>
        </div>

        <div style={{ fontSize: 14, color: C.light, paddingTop: 12 }}>=</div>

        {/* Balance */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Balance</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color, lineHeight: 1, transition: 'color 0.3s' }}>
            {balance >= 0 ? balance : balance}
          </div>
          <div style={{ fontSize: 8, color, marginTop: 1, fontWeight: 600, transition: 'color 0.3s' }}>{label}</div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div style={{ height: 6, background: '#F0EBE3', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, pctConsumido)}%`,
          background: pctConsumido > 100
            ? 'linear-gradient(90deg,#C62828,#E53935)'
            : pctConsumido > 85
            ? 'linear-gradient(90deg,#F9A825,#E8621A)'
            : `linear-gradient(90deg,${C.green},#7AB648)`,
          borderRadius: 100,
          transition: 'width 0.5s ease, background 0.3s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#C0B8B0', marginTop: 3 }}>
        <span>0</span>
        <span>{Math.round(presupuestoTotal / 2)}</span>
        <span>{presupuestoTotal} kcal</span>
      </div>
    </div>
  );
}