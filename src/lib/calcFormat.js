// تنسيق موحّد للأرقام في واجهة الآلة الحاسبة والخطوات.
// أرقام عادية بدقة 12 خانة، وترميز أُسّي للقيم الضخمة أو الدقيقة جدًا.
export function fmt(n) {
  if (!Number.isFinite(n)) return String(n)
  if (n === 0) return '0'
  const a = Math.abs(n)
  if (a >= 1e15 || a < 1e-9) return n.toExponential(8).replace(/\.?0+e/, 'e').replace('e+', 'e')
  return String(Number(n.toPrecision(12)))
}
