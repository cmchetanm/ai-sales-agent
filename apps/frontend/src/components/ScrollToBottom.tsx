import { Fab } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export function ScrollToBottom({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  if (!visible) return null;
  return (
    <Fab
      size="small"
      color="primary"
      onClick={onClick}
      sx={{ position: 'absolute', right: 16, bottom: 16, zIndex: 1 }}
      aria-label="scroll to bottom"
    >
      <KeyboardArrowDownIcon />
    </Fab>
  );
}

