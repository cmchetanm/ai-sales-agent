import { useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import { StatusChip } from './StatusChip';

export function StatusSelectChip({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  return (
    <>
      <span onClick={(e) => !disabled && setAnchorEl(e.currentTarget as HTMLElement)} style={{ cursor: disabled ? 'default' : 'pointer' }}>
        <StatusChip value={value} />
      </span>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        {options.map((opt) => (
          <MenuItem
            key={opt}
            selected={opt === value}
            onClick={() => {
              setAnchorEl(null);
              if (opt !== value) onChange(opt);
            }}
          >
            {opt}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

// For test coverage: deterministic export
export const __statusSelectChipProbe = true;
