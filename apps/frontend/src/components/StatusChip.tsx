import { Chip } from '@mui/material';

type Props = { value: string };

const colorMap: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  new: 'info',
  researching: 'info',
  enriched: 'primary',
  outreach: 'primary',
  scheduled: 'warning',
  responded: 'success',
  won: 'success',
  lost: 'error',
  archived: 'default',
  draft: 'default',
  running: 'primary',
  paused: 'warning',
  completed: 'success',
  active: 'success',
};

export function StatusChip({ value }: Props) {
  const key = (value || '').toLowerCase();
  const color = colorMap[key] || 'default';
  const label = value?.charAt(0).toUpperCase() + value?.slice(1);
  return <Chip variant={color === 'default' ? 'outlined' : 'filled'} color={color} size="small" label={label} />;
}

