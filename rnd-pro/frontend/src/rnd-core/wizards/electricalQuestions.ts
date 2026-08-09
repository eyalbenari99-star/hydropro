import type { WizardQuestion } from '../data-model';

export const electricalQuestions: WizardQuestion[] = [
  { id: 'application_type', type: 'select', required: true,
    label: 'What application is this cabinet for?',
    options: [
      { value: 'irrigation_pump_station',  label: 'Irrigation / pump station' },
      { value: 'greenhouse_main',           label: 'Greenhouse main distribution' },
      { value: 'chiller_skid',              label: 'Chiller / refrigeration skid' },
      { value: 'lighting_distribution',     label: 'Lighting distribution' },
      { value: 'machine_room',              label: 'Machine room / utility' }
    ]
  },
  { id: 'supply_voltage', type: 'select', required: true, label: 'Supply voltage',
    options: [
      { value: '230V',     label: 'Single-phase 230 V' },
      { value: '400V',     label: 'Three-phase 400 V (3P+N+PE)' },
      { value: '380V',     label: 'Three-phase 380 V (3P+N+PE)' },
      { value: '480V',     label: 'Three-phase 480 V (industrial)' }
    ]
  },
  { id: 'short_circuit_ka', type: 'select', required: true,
    label: 'Short-circuit rating required',
    options: [
      { value: 6,  label: '6 kA · residential / small industrial' },
      { value: 10, label: '10 kA · industrial' },
      { value: 25, label: '25 kA · large industrial' },
      { value: 35, label: '35 kA · process plant' }
    ]
  },
  { id: 'main_breaker_a', type: 'number', required: true, label: 'Main breaker rating (A)', min: 32, max: 1600, default: 500 },
  { id: 'has_metering', type: 'boolean', label: 'Include energy meter + CTs?', default: true },
  { id: 'has_surge_protection', type: 'boolean', label: 'Include surge protection (SPD)?', default: false },
  { id: 'feeders_count', type: 'number', required: true, label: 'Number of outgoing feeders', min: 1, max: 64, default: 11 },
  { id: 'default_feeder_kind', type: 'select', required: true,
    label: 'Typical load on these feeders',
    options: [
      { value: 'water_pump', label: 'Water pumps (2.2 kW)' },
      { value: 'roof_fan',   label: 'Roof / ventilation fans' },
      { value: 'chiller',    label: 'Chillers' },
      { value: 'machine',    label: 'Machines / motors' },
      { value: 'outlet',     label: 'AC outlets / general use' }
    ]
  },
  { id: 'include_shading_panel', type: 'boolean', label: 'Add shading / window-system sub-panel?', default: false },
  { id: 'cabinet_enclosure', type: 'select', required: true, label: 'Cabinet enclosure',
    options: [
      { value: 'IP54', label: 'IP54 · indoor industrial' },
      { value: 'IP55', label: 'IP55 · outdoor sheltered' },
      { value: 'IP65', label: 'IP65 · outdoor' },
      { value: 'IP66', label: 'IP66 · washdown / marine' }
    ]
  },
  { id: 'preferred_manufacturer', type: 'select', label: 'Preferred manufacturer family',
    options: [
      { value: 'chint',     label: 'CHINT (NXB / NXC / JR36 / NM1)' },
      { value: 'schneider', label: 'Schneider Electric' },
      { value: 'abb',       label: 'ABB' },
      { value: 'siemens',   label: 'Siemens' }
    ]
  },
  { id: 'cable_glands_position', type: 'select', label: 'Cable entry side',
    options: [{value:'bottom', label:'Bottom'},{value:'top', label:'Top'},{value:'rear', label:'Rear'}]
  },
  { id: 'include_plc', type: 'boolean', label: 'Add PLC for automation?', default: false },
  { id: 'plc_io_count', type: 'number', label: 'PLC I/O points (if PLC)', min: 0, max: 256, default: 32 },
  { id: 'project_title', type: 'text', label: 'Project title for the title block', default: '' }
];
