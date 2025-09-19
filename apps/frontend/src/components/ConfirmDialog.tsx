import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function ConfirmDialog({ open, title, message, onClose, onConfirm }: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="confirm-title">
      <DialogTitle id="confirm-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="text">{t('common.cancel')}</Button>
        <Button onClick={onConfirm} color="error" variant="contained">{t('common.confirm')}</Button>
      </DialogActions>
    </Dialog>
  );
}
