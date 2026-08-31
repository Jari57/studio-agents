import React, { useState } from 'react';
import { boundedProducerValue } from '../../utils/producerSession.mjs';

// Sliders are useful for shaping a mix; numeric entry makes settings repeatable
// and usable with a keyboard. Keep incomplete input local until committed.
export default function ProducerControl({ label, name = label, value, min, max, step, unit = '', onChange, disabled }) {
  const [draft, setDraft] = useState(null);
  const commit = (raw) => {
    onChange(boundedProducerValue(raw, min, max, value));
    setDraft(null);
  };
  return (
    <div className="producer-precise-control" role="group" aria-label={name}>
      <div className="producer-control-heading"><span>{label}</span><small>{unit}</small></div>
      <input type="range" aria-label={`${name} slider`} min={min} max={max} step={step} value={value} disabled={disabled}
        onChange={event => { setDraft(null); onChange(Number(event.target.value)); }} />
      <input type="number" aria-label={`${name} value`} inputMode="decimal" min={min} max={max} step={step} value={draft ?? value} disabled={disabled}
        onChange={event => {
          const raw = event.target.value;
          setDraft(raw);
          const parsed = Number(raw);
          if (raw !== '' && Number.isFinite(parsed) && parsed >= min && parsed <= max) onChange(parsed);
        }}
        onBlur={event => commit(event.target.value)}
        onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
    </div>
  );
}
