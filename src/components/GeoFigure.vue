<script setup>
// الرسوم التوضيحية للأشكال الهندسية (SVG ثابت + وصف مترجَم لقارئ الشاشة).
// فوّضناه لمكوّن مستقل ليصغر ملف الصفحة ويُعاد استخدامه إن لزم.
import { useI18n } from '../composables/i18n'

defineProps({ id: { type: String, required: true } })

const { L } = useI18n()
</script>

<template>
  <div class="shape-figure">
    <svg v-if="id === 'circle'" viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('رسم توضيحي للدائرة مع نصف القطر والقطر', 'Circle illustration showing radius and diameter')">
      <circle cx="60" cy="60" r="48" fill="none" stroke="#4f9cf9" stroke-width="2" stroke-dasharray="6 3" opacity="0.5"/>
      <circle cx="60" cy="60" r="2.5" fill="#4f9cf9"/>
      <line x1="60" y1="60" x2="108" y2="60" stroke="#4f9cf9" stroke-width="1.5" opacity="0.8"/>
      <text x="82" y="55" fill="#4f9cf9" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">r</text>
      <line x1="12" y1="60" x2="108" y2="60" stroke="#a78bfa" stroke-width="1" opacity="0.4" stroke-dasharray="3 2"/>
      <text x="60" y="76" fill="#a78bfa" font-size="8" font-family="Cairo,sans-serif" text-anchor="middle">d = 2r</text>
    </svg>

    <svg v-else-if="id === 'square'" viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('رسم توضيحي للمربع مع الضلع والقطر', 'Square illustration showing side and diagonal')">
      <rect x="15" y="15" width="90" height="90" fill="none" stroke="#34d399" stroke-width="2" stroke-dasharray="6 3" opacity="0.6"/>
      <line x1="15" y1="15" x2="105" y2="105" stroke="#a78bfa" stroke-width="1" opacity="0.4" stroke-dasharray="3 2"/>
      <line x1="15" y1="8" x2="105" y2="8" stroke="#34d399" stroke-width="1.5" opacity="0.8"/>
      <text x="60" y="6" fill="#34d399" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
    </svg>

    <svg v-else-if="id === 'rect'" viewBox="0 0 140 100" width="140" height="100" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('رسم توضيحي للمستطيل بالعرض والارتفاع', 'Rectangle illustration showing width and height')">
      <rect x="10" y="15" width="120" height="70" fill="none" stroke="#fb923c" stroke-width="2" stroke-dasharray="6 3" opacity="0.6"/>
      <line x1="10" y1="15" x2="130" y2="85" stroke="#a78bfa" stroke-width="1" opacity="0.4" stroke-dasharray="3 2"/>
      <text x="70" y="10" fill="#fb923c" font-size="8" font-family="Cairo,sans-serif" text-anchor="middle">w</text>
      <text x="136" y="54" fill="#fb923c" font-size="8" font-family="Cairo,sans-serif" text-anchor="middle">h</text>
    </svg>

    <svg v-else-if="id === 'triangle'" viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('رسم توضيحي لمثلث بأضلاعه a و b و c', 'Triangle illustration with sides a, b and c')">
      <polygon points="15,95 125,95 85,15" fill="none" stroke="#f87171" stroke-width="2" stroke-dasharray="6 3" opacity="0.65"/>
      <text x="70" y="108" fill="#f87171" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">c</text>
      <text x="112" y="50" fill="#f87171" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">b</text>
      <text x="42" y="50" fill="#f87171" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
    </svg>

    <svg v-else-if="id === 'right'" viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('مثلث قائم الزاوية بساقيه a و b والوتر c', 'Right triangle with legs a and b and hypotenuse c')">
      <polygon points="22,95 122,95 22,15" fill="none" stroke="#34d399" stroke-width="2" stroke-dasharray="6 3" opacity="0.7"/>
      <polyline points="22,79 38,79 38,95" fill="none" stroke="#a78bfa" stroke-width="1.5" opacity="0.6"/>
      <line x1="22" y1="15" x2="122" y2="95" stroke="#f59e0b" stroke-width="1.5" opacity="0.75" stroke-dasharray="3 2"/>
      <text x="72" y="108" fill="#34d399" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">b</text>
      <text x="8" y="58" fill="#34d399" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
      <text x="84" y="45" fill="#f59e0b" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">c</text>
    </svg>

    <svg v-else-if="id === 'rhombus'" viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('معين مع قطريه', 'Rhombus with its two diagonals')">
      <polygon points="70,12 128,55 70,98 12,55" fill="none" stroke="#22d3ee" stroke-width="2" stroke-dasharray="6 3" opacity="0.7"/>
      <line x1="12" y1="55" x2="128" y2="55" stroke="#a78bfa" stroke-width="1" opacity="0.45" stroke-dasharray="3 2"/>
      <line x1="70" y1="12" x2="70" y2="98" stroke="#a78bfa" stroke-width="1" opacity="0.45" stroke-dasharray="3 2"/>
      <text x="98" y="50" fill="#22d3ee" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">d₁</text>
      <text x="80" y="34" fill="#22d3ee" font-size="9" font-family="Cairo,sans-serif">d₂</text>
    </svg>

    <svg v-else-if="id === 'parallelogram'" viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('متوازي أضلاع بقاعدته وارتفاعه وضلعه', 'Parallelogram with its base, height and side')">
      <polygon points="30,92 130,92 110,22 10,22" fill="none" stroke="#f472b6" stroke-width="2" stroke-dasharray="6 3" opacity="0.7"/>
      <line x1="30" y1="92" x2="30" y2="22" stroke="#a78bfa" stroke-width="1" opacity="0.5" stroke-dasharray="3 2"/>
      <polyline points="30,78 44,78 44,92" fill="none" stroke="#a78bfa" stroke-width="1" opacity="0.5"/>
      <text x="80" y="106" fill="#f472b6" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">b</text>
      <text x="39" y="60" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">h</text>
      <text x="10" y="44" fill="#f472b6" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
    </svg>

    <svg v-else-if="id === 'trapezoid'" viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('شبه منحرف بقاعدتيه وارتفاعه وضلعيه', 'Trapezoid with its bases, height and legs')">
      <polygon points="20,92 120,92 96,22 44,22" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="6 3" opacity="0.7"/>
      <line x1="44" y1="22" x2="44" y2="92" stroke="#a78bfa" stroke-width="1" opacity="0.5" stroke-dasharray="3 2"/>
      <text x="70" y="106" fill="#fbbf24" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
      <text x="70" y="16" fill="#fbbf24" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">b</text>
      <text x="37" y="60" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">h</text>
      <text x="22" y="58" fill="#fbbf24" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">c</text>
      <text x="116" y="58" fill="#fbbf24" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">d</text>
    </svg>

    <svg v-else-if="id === 'polygon'" viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('مضلع منتظم سداسي مع ضلعه وعاموده', 'Regular hexagon with its side and apothem')">
      <polygon points="70,10 109,33 109,78 70,100 31,78 31,33" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-dasharray="6 3" opacity="0.7"/>
      <line x1="70" y1="55" x2="109" y2="33" stroke="#a78bfa" stroke-width="1" opacity="0.5" stroke-dasharray="3 2"/>
      <line x1="70" y1="10" x2="70" y2="100" stroke="#a78bfa" stroke-width="1" opacity="0.3" stroke-dasharray="3 2"/>
      <circle cx="70" cy="55" r="2.5" fill="#a78bfa"/>
      <text x="120" y="58" fill="#2dd4bf" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">s</text>
      <text x="99" y="40" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">r</text>
    </svg>

    <svg v-else-if="id === 'ellipse'" viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('قطع ناقص مع نصف محوره الأكبر والأصغر', 'Ellipse with its semi-major and semi-minor axes')">
      <ellipse cx="70" cy="55" rx="56" ry="34" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.7"/>
      <line x1="14" y1="55" x2="126" y2="55" stroke="#a78bfa" stroke-width="1" opacity="0.5" stroke-dasharray="3 2"/>
      <line x1="70" y1="21" x2="70" y2="89" stroke="#a78bfa" stroke-width="1" opacity="0.5" stroke-dasharray="3 2"/>
      <circle cx="70" cy="55" r="2.5" fill="#60a5fa"/>
      <text x="99" y="50" fill="#60a5fa" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
      <text x="80" y="35" fill="#60a5fa" font-size="9" font-family="Cairo,sans-serif">b</text>
    </svg>

    <svg v-else-if="id === 'sector'" viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('قطاع دائري بزاويته ونصف قطره', 'Circular sector with its angle and radius')">
      <path d="M60,90 L60,30 A60,60 0 0,1 111.96,60 Z" fill="none" stroke="#fb7185" stroke-width="2" stroke-dasharray="6 3" opacity="0.75"/>
      <circle cx="60" cy="90" r="2.5" fill="#fb7185"/>
      <path d="M60,72 A18,18 0 0,1 75.6,81 Z" fill="none" stroke="#a78bfa" stroke-width="1" opacity="0.6"/>
      <text x="53" y="58" fill="#fb7185" font-size="9" font-family="Cairo,sans-serif" text-anchor="end">r</text>
      <text x="72" y="84" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif">θ</text>
    </svg>

    <svg v-else-if="id === 'sphere'" viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('رسم توضيحي للكرة ونصف قطرها', 'Sphere illustration showing its radius')">
      <circle cx="60" cy="60" r="46" fill="none" stroke="#a78bfa" stroke-width="2" opacity="0.65"/>
      <ellipse cx="60" cy="60" rx="46" ry="14" fill="none" stroke="#a78bfa" stroke-width="1" stroke-dasharray="4 3" opacity="0.45"/>
      <line x1="60" y1="60" x2="106" y2="60" stroke="#4f9cf9" stroke-width="1.5"/>
      <circle cx="60" cy="60" r="2.5" fill="#4f9cf9"/>
      <text x="83" y="55" fill="#4f9cf9" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">r</text>
    </svg>

    <svg v-else-if="id === 'hemisphere'" viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('نصف كرة مع نصف قطره وقاعدته الدائرية', 'Hemisphere with its radius and circular base')">
      <path d="M25,75 A45,45 0 0,1 115,75" fill="none" stroke="#818cf8" stroke-width="2" opacity="0.8"/>
      <ellipse cx="70" cy="75" rx="45" ry="14" fill="none" stroke="#818cf8" stroke-width="1.5" opacity="0.55"/>
      <line x1="70" y1="75" x2="70" y2="30" stroke="#a78bfa" stroke-width="1.5" opacity="0.6"/>
      <circle cx="70" cy="75" r="2.5" fill="#818cf8"/>
      <text x="62" y="52" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif" text-anchor="end">r</text>
      <line x1="25" y1="75" x2="115" y2="75" stroke="#a78bfa" stroke-width="1" opacity="0.35" stroke-dasharray="3 2"/>
    </svg>

    <svg v-else-if="id === 'cube'" viewBox="0 0 130 122" width="130" height="122" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('مكعب مع ضلعه', 'Cube with its side')">
      <polygon points="30,45 90,45 90,105 30,105" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.65"/>
      <polygon points="30,45 55,25 115,25 90,45" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.45"/>
      <polygon points="90,45 115,25 115,85 90,105" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.45"/>
      <text x="60" y="119" fill="#38bdf8" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
    </svg>

    <svg v-else-if="id === 'cuboid'" viewBox="0 0 140 125" width="140" height="125" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('متوازي مستطيلات بأبعاده الثلاثة', 'Cuboid with its three dimensions')">
      <polygon points="25,55 95,55 95,110 25,110" fill="none" stroke="#818cf8" stroke-width="2" opacity="0.65"/>
      <polygon points="25,55 55,30 125,30 95,55" fill="none" stroke="#818cf8" stroke-width="2" opacity="0.45"/>
      <polygon points="95,55 125,30 125,85 95,110" fill="none" stroke="#818cf8" stroke-width="2" opacity="0.45"/>
      <text x="60" y="122" fill="#818cf8" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">l</text>
      <text x="112" y="85" fill="#818cf8" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">h</text>
      <text x="40" y="41" fill="#818cf8" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">w</text>
    </svg>

    <svg v-else-if="id === 'cylinder'" viewBox="0 0 140 120" width="140" height="120" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('أسطوانة بنصف قطرها وارتفاعها', 'Cylinder with its radius and height')">
      <ellipse cx="70" cy="28" rx="44" ry="14" fill="none" stroke="#c084fc" stroke-width="2" opacity="0.7"/>
      <path d="M26,28 L26,92 A44,14 0 0,0 114,92 L114,28" fill="none" stroke="#c084fc" stroke-width="2" opacity="0.7"/>
      <line x1="70" y1="28" x2="114" y2="28" stroke="#a78bfa" stroke-width="1" opacity="0.55" stroke-dasharray="3 2"/>
      <circle cx="70" cy="28" r="2.5" fill="#c084fc"/>
      <text x="93" y="24" fill="#c084fc" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">r</text>
      <text x="17" y="63" fill="#c084fc" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">h</text>
    </svg>

    <svg v-else-if="id === 'cone'" viewBox="0 0 140 122" width="140" height="122" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('مخروط بنصف قطر قاعدته وارتفاعه وارتفاعه الجانبي', 'Cone with its base radius, height and slant height')">
      <ellipse cx="70" cy="95" rx="46" ry="14" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.5"/>
      <path d="M70,15 L24,95 A46,14 0 0,0 116,95 Z" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.75"/>
      <line x1="70" y1="15" x2="70" y2="95" stroke="#a78bfa" stroke-width="1" opacity="0.55" stroke-dasharray="3 2"/>
      <line x1="70" y1="95" x2="116" y2="95" stroke="#a78bfa" stroke-width="1" opacity="0.5" stroke-dasharray="3 2"/>
      <circle cx="70" cy="95" r="2.5" fill="#f59e0b"/>
      <text x="63" y="58" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif" text-anchor="end">h</text>
      <text x="95" y="110" fill="#f59e0b" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">r</text>
      <text x="38" y="52" fill="#f59e0b" font-size="9" font-family="Cairo,sans-serif" text-anchor="end">l</text>
    </svg>

    <svg v-else-if="id === 'obliqueCylinder'" viewBox="0 0 150 120" width="150" height="120" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('أسطوانة مائلة مع ارتفاعها العمودي وزاوية ميلها', 'Oblique cylinder with its perpendicular height and tilt angle')">
      <ellipse cx="55" cy="95" rx="38" ry="12" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.7"/>
      <ellipse cx="85" cy="30" rx="38" ry="12" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.7"/>
      <line x1="17" y1="95" x2="47" y2="30" stroke="#60a5fa" stroke-width="2" opacity="0.7"/>
      <line x1="93" y1="95" x2="123" y2="30" stroke="#60a5fa" stroke-width="2" opacity="0.7"/>
      <line x1="85" y1="30" x2="85" y2="95" stroke="#a78bfa" stroke-width="1.5" opacity="0.6" stroke-dasharray="4 3"/>
      <line x1="85" y1="30" x2="55" y2="95" stroke="#a78bfa" stroke-width="1" opacity="0.4" stroke-dasharray="3 2"/>
      <circle cx="85" cy="95" r="2" fill="#a78bfa"/>
      <text x="92" y="66" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif">h</text>
      <text x="58" y="112" fill="#60a5fa" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">2r</text>
    </svg>

    <svg v-else-if="id === 'pyramid'" viewBox="0 0 140 122" width="140" height="122" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('هرم قاعدته مربعة مع ارتفاعه', 'Square-based pyramid with its height')">
      <polygon points="20,80 70,102 120,80 70,58" fill="none" stroke="#f472b6" stroke-width="1.5" opacity="0.55"/>
      <line x1="70" y1="12" x2="20" y2="80" stroke="#f472b6" stroke-width="2" opacity="0.8"/>
      <line x1="70" y1="12" x2="120" y2="80" stroke="#f472b6" stroke-width="2" opacity="0.8"/>
      <line x1="70" y1="12" x2="70" y2="102" stroke="#f472b6" stroke-width="2" opacity="0.8"/>
      <line x1="70" y1="12" x2="70" y2="58" stroke="#f472b6" stroke-width="1.5" opacity="0.4" stroke-dasharray="4 3"/>
      <line x1="70" y1="12" x2="70" y2="80" stroke="#a78bfa" stroke-width="1" opacity="0.6" stroke-dasharray="3 2"/>
      <circle cx="70" cy="80" r="2.5" fill="#a78bfa"/>
      <text x="62" y="48" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif" text-anchor="end">h</text>
      <text x="42" y="98" fill="#f472b6" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
    </svg>

    <svg v-else-if="id === 'prism'" viewBox="0 0 140 126" width="140" height="126" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('منشور سداسي مع ارتفاعه وضلع قاعدته', 'Hexagonal prism with its height and base side')">
      <polygon points="102,45 86,31 54,31 38,45 54,59 86,59" fill="none" stroke="#2dd4bf" stroke-width="2" opacity="0.7"/>
      <path d="M38,45 L38,90 L54,104 L86,104 L102,90 L102,45" fill="none" stroke="#2dd4bf" stroke-width="2" opacity="0.7"/>
      <line x1="54" y1="59" x2="54" y2="104" stroke="#2dd4bf" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 3"/>
      <line x1="86" y1="59" x2="86" y2="104" stroke="#2dd4bf" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 3"/>
      <text x="70" y="26" fill="#2dd4bf" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">s</text>
      <text x="30" y="70" fill="#2dd4bf" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">h</text>
    </svg>

    <svg v-else-if="id === 'frustum'" viewBox="0 0 150 120" width="150" height="120" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('مخروط ناقص بقاعدتيه وارتفاعه', 'Cone frustum with its two bases and height')">
      <ellipse cx="70" cy="95" rx="42" ry="13" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.7"/>
      <ellipse cx="70" cy="30" rx="22" ry="8" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.7"/>
      <line x1="28" y1="95" x2="48" y2="30" stroke="#f59e0b" stroke-width="2" opacity="0.7"/>
      <line x1="112" y1="95" x2="92" y2="30" stroke="#f59e0b" stroke-width="2" opacity="0.7"/>
      <line x1="70" y1="30" x2="70" y2="95" stroke="#a78bfa" stroke-width="1.5" opacity="0.6" stroke-dasharray="4 3"/>
      <circle cx="70" cy="95" r="2" fill="#a78bfa"/>
      <text x="77" y="66" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif">h</text>
      <text x="46" y="26" fill="#f59e0b" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">r₂</text>
      <text x="70" y="114" fill="#f59e0b" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">2r₁</text>
    </svg>

    <svg v-else-if="id === 'obliqueBox'" viewBox="0 0 165 122" width="150" height="111" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('متوازي سطوح مائل مع أبعاده وزاوية ميل حرفه', 'Oblique parallelepiped with its dimensions and edge tilt')">
      <polygon points="25,100 100,100 120,88 45,88" fill="none" stroke="#34d399" stroke-width="1.5" opacity="0.5"/>
      <polygon points="47,48 122,48 142,36 67,36" fill="none" stroke="#34d399" stroke-width="2" opacity="0.7"/>
      <line x1="25" y1="100" x2="47" y2="48" stroke="#34d399" stroke-width="2" opacity="0.7"/>
      <line x1="100" y1="100" x2="122" y2="48" stroke="#34d399" stroke-width="2" opacity="0.7"/>
      <line x1="120" y1="88" x2="142" y2="36" stroke="#34d399" stroke-width="2" opacity="0.7"/>
      <line x1="45" y1="88" x2="67" y2="36" stroke="#34d399" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 3"/>
      <line x1="47" y1="48" x2="47" y2="100" stroke="#a78bfa" stroke-width="1.5" opacity="0.6" stroke-dasharray="4 3"/>
      <circle cx="47" cy="100" r="2" fill="#a78bfa"/>
      <text x="53" y="78" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif">h</text>
      <text x="62" y="113" fill="#34d399" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
      <text x="112" y="103" fill="#34d399" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">b</text>
      <text x="120" y="72" fill="#34d399" font-size="9" font-family="Cairo,sans-serif">c</text>
    </svg>
  </div>
</template>
