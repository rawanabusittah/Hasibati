// ── لوحة أرقام الآلة الحاسبة ──
// كل زر: act (الإجراء) + label (المعروض) + cls (التنسيق) + val (النص المُدرَج) + aria (تلميح ثنائي اللغة).
// تُبنى عبر دالة تأخذ `L` لأن تلميحات قارئ الشاشة ثنائية اللغة.
export function buildPad(L) {
  return [
    { act: 'clear', label: 'AC', cls: 'clear', aria: [L('مسح الكل (AC)', 'Clear all (AC)')] },
    { act: 'back', label: '⌫', cls: 'fn', aria: [L('مسح آخر حرف', 'Backspace')] },
    { act: 'append', val: '(', label: '(', cls: 'fn', aria: [L('قوس فتح', 'Open parenthesis')] },
    { act: 'append', val: ')', label: ')', cls: 'fn', aria: [L('قوس إغلاق', 'Close parenthesis')] },
    { act: 'append', val: '7', label: '7', cls: '' },
    { act: 'append', val: '8', label: '8', cls: '' },
    { act: 'append', val: '9', label: '9', cls: '' },
    { act: 'append', val: '÷', label: '÷', cls: 'op', aria: [L('قسمة', 'Divide')] },
    { act: 'append', val: '4', label: '4', cls: '' },
    { act: 'append', val: '5', label: '5', cls: '' },
    { act: 'append', val: '6', label: '6', cls: '' },
    { act: 'append', val: '×', label: '×', cls: 'op', aria: [L('ضرب', 'Multiply')] },
    { act: 'append', val: '1', label: '1', cls: '' },
    { act: 'append', val: '2', label: '2', cls: '' },
    { act: 'append', val: '3', label: '3', cls: '' },
    { act: 'append', val: '-', label: '−', cls: 'op', aria: [L('طرح', 'Subtract')] },
    { act: 'append', val: '0', label: '0', cls: '' },
    { act: 'append', val: '.', label: '.', cls: '', aria: [L('فاصلة عشرية', 'Decimal point')] },
    { act: 'fn', val: 'neg', label: '±', cls: 'fn', aria: [L('تغيير الإشارة', 'Toggle sign')] },
    { act: 'append', val: '+', label: '+', cls: 'op', aria: [L('جمع', 'Add')] },
    { act: 'append', val: 'x', label: 'x', cls: 'fn', aria: [L('المتغير x للدوال', 'The variable x for functions')] },
    { act: 'fn', val: 'pi', label: 'π', cls: 'fn', aria: [L('باي', 'Pi')] },
    { act: 'fn', val: 'e', label: 'e', cls: 'fn', aria: [L('العدد النيبيري', "Euler's number")] },
    { act: 'append', val: ',', label: ',', cls: 'fn', aria: [L('فاصلة بين الوسائط', 'Argument separator')] },
    { act: 'append', val: '≤', label: '≤', cls: 'op', aria: [L('أصغر من أو يساوي', 'Less than or equal to')] },
    { act: 'append', val: '≥', label: '≥', cls: 'op', aria: [L('أكبر من أو يساوي', 'Greater than or equal to')] },
    { act: 'append', val: '<', label: '<', cls: 'op', aria: [L('أصغر من', 'Less than')] },
    { act: 'append', val: '>', label: '>', cls: 'op', aria: [L('أكبر من', 'Greater than')] },
    { act: 'append', val: 'i', label: 'i', cls: 'op', aria: [L('الوحدة التخيلية', 'Imaginary unit i')] },
    { act: 'equals', label: '=', cls: 'eq', aria: [L('احسب النتيجة', 'Calculate')] }
  ]
}
