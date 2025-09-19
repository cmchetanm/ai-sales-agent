import { Chip } from '@mui/material';

const colorBySource: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
  apollo: 'primary',
  linkedin: 'info',
  hubspot: 'warning',
  salesforce: 'secondary',
  aggregator: 'success',
  seed: 'default',
};

const labelBySource: Record<string, string> = {
  apollo: 'Apollo',
  linkedin: 'LinkedIn',
  hubspot: 'HubSpot',
  salesforce: 'SFDC',
  aggregator: 'DB+Vendors',
  seed: 'Seed',
};

export function SourceBadge({ source }: { source?: string }) {
  const key = (source || '').toLowerCase();
  const color = colorBySource[key] || 'default';
  const label = labelBySource[key] || (source ? source : '—');
  return <Chip size="small" variant={color === 'default' ? 'outlined' : 'filled'} color={color} label={label} />;
}

