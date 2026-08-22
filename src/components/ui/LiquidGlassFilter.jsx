export default function LiquidGlassFilter() {
  return (
    <svg className="hidden" aria-hidden="true" width="0" height="0">
      <defs>
        <filter id="liquid-glass-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.015" numOctaves="2" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0" in="noise" result="coloredNoise" />

          {/* Edge falloff map */}
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blurredAlpha" />
          <feComposite in="noise" in2="blurredAlpha" operator="in" result="maskedNoise" />

          {/* Refraction */}
          <feDisplacementMap in="SourceGraphic" in2="maskedNoise" scale="15" xChannelSelector="R" yChannelSelector="G" result="refraction" />

          {/* Chromatic Dispersion (RGB split) */}
          <feOffset dx="-1" dy="0" in="refraction" result="redSplit"/>
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" in="redSplit" result="redOnly" />

          <feOffset dx="0" dy="0" in="refraction" result="greenSplit"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" in="greenSplit" result="greenOnly" />

          <feOffset dx="1" dy="0" in="refraction" result="blueSplit"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" in="blueSplit" result="blueOnly" />

          {/* Recombine RGB */}
          <feComposite in="redOnly" in2="greenOnly" operator="screen" result="redGreen" />
          <feComposite in="redGreen" in2="blueOnly" operator="screen" result="rainbowDispersion" />

          {/* Combine with original with a bit of frost */}
          <feGaussianBlur in="rainbowDispersion" stdDeviation="0.5" result="frosted" />
          <feComposite in="frosted" in2="SourceAlpha" operator="in" result="final" />
        </filter>
      </defs>
    </svg>
  )
}
