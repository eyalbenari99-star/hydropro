import React from 'react';

export function NexiOrb({ size = 'medium', active = true }: { size?: 'small' | 'medium' | 'large'; active?: boolean }) {
  return (
    <span className={`nexi-orb nexi-orb--${size} ${active ? 'is-active' : ''}`} aria-label={active ? 'Nexi is active' : 'Nexi is paused'}>
      <span className="nexi-orb__ring nexi-orb__ring--one" />
      <span className="nexi-orb__ring nexi-orb__ring--two" />
      <span className="nexi-orb__core">N</span>
    </span>
  );
}
