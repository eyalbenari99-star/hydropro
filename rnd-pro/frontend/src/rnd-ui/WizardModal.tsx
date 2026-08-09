import React from 'react';
import { ElectricalWizard } from './wizards/ElectricalWizard';
import { PlumbingWizard }   from './wizards/PlumbingWizard';
import { CivilWizard }      from './wizards/CivilWizard';

interface WizardModalProps {
  discipline: 'electrical' | 'plumbing' | 'civil';
  onClose: () => void;
}

export const WizardModal: React.FC<WizardModalProps> = ({ discipline, onClose }) => {
  return (
    <div className="rnd-modal">
      <div className="rnd-modal-body" style={{ maxWidth: 900 }}>
        <button className="rnd-modal-close" onClick={onClose}>&times;</button>
        {discipline === 'electrical' && (
          <>
            <h2 title="Answer a few questions about panel type, feeders, and brand. The system sizes breakers, contactors, overloads, and cables and builds a full cabinet layout.">
              Electrical wizard
            </h2>
            <ElectricalWizard onBuilt={() => onClose()} />
          </>
        )}
        {discipline === 'plumbing' && (
          <>
            <h2 title="Answer a few questions about flow, pressure, zones, and filtration. The system calculates pump duty, pipe diameters, and builds a hydraulic schematic.">
              Plumbing / irrigation wizard
            </h2>
            <PlumbingWizard onBuilt={() => onClose()} />
          </>
        )}
        {discipline === 'civil' && (
          <>
            <h2 title="Answer questions about structure type, spans, and material. The system builds a parametric civil structure with columns, rafters, purlins, foundations.">
              Civil wizard
            </h2>
            <CivilWizard onDone={onClose} />
          </>
        )}
      </div>
    </div>
  );
};
