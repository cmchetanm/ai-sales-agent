import { InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export function SearchBar({ value, onChange, placeholder = 'Search...' }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        )
      }}
      sx={{ minWidth: 240 }}
    />
  );
}

