import type { WizardQuestion } from '../data-model';

export const plumbingQuestions: WizardQuestion[] = [
  { id: 'system_type', type: 'select', required: true, label: 'System type',
    options: [
      { value: 'fertigation', label: 'Fertigation (greenhouse drip)' },
      { value: 'irrigation',  label: 'Plain irrigation (drip / sprinkler)' },
      { value: 'cooling_pad', label: 'Cooling pad supply' },
      { value: 'process',     label: 'Process water (industrial)' }
    ]
  },
  { id: 'source_type', type: 'select', required: true, label: 'Water source',
    options: [
      { value: 'reservoir',     label: 'Open reservoir' },
      { value: 'borewell',      label: 'Borewell / well' },
      { value: 'mains_supply',  label: 'Municipal mains' },
      { value: 'rainwater_tank',label: 'Rainwater tank' }
    ]
  },
  { id: 'zones_count', type: 'number', required: true, label: 'Number of irrigation zones', min: 1, max: 64, default: 4 },
  { id: 'total_flow_m3h', type: 'number', required: true, label: 'Total flow demand (m³/h)', min: 0.5, max: 500, default: 12 },
  { id: 'working_pressure_bar', type: 'number', required: true, label: 'Working pressure (bar)', min: 0.5, max: 10, default: 3.5 },
  { id: 'filter_micron', type: 'select', label: 'Filtration grade',
    options: [
      { value: 130, label: '130 µm · disc filter (drip)' },
      { value: 80,  label: '80 µm · screen' },
      { value: 50,  label: '50 µm · sand filter' },
      { value: 5,   label: '5 µm · RO pre-filter' }
    ]
  },
  { id: 'has_fertigation', type: 'boolean', label: 'Include fertigation (A/B + acid drums)?', default: true },
  { id: 'fert_drums_count', type: 'number', label: 'Number of fertilizer drums', min: 0, max: 8, default: 2 },
  { id: 'has_dosing_unit', type: 'boolean', label: 'Add a dosing unit?', default: true },
  { id: 'has_ec_ph_sensors', type: 'boolean', label: 'Add EC + pH sensors?', default: true },
  { id: 'pipe_material', type: 'select', label: 'Main pipe material',
    options: [
      { value: 'pvc',  label: 'PVC' },
      { value: 'pe',   label: 'PE (polyethylene)' },
      { value: 'gi',   label: 'GI (galvanised steel)' },
      { value: 'pprc', label: 'PPRC' }
    ]
  },
  { id: 'project_title', type: 'text', label: 'Project title', default: '' }
];
