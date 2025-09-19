import { Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function PaginationControls({
  page,
  pages,
  onPageChange,
  disabled,
}: {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const canPrev = page > 1;
  const canNext = pages > 0 && page < pages;
  const { t } = useTranslation();
  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" sx={{ mt: 1 }}>
      <Typography variant="caption">{t('common.page_of', { page: pages ? page : 0, pages })}</Typography>
      <Button size="small" variant="outlined" onClick={() => onPageChange(page - 1)} disabled={!canPrev || disabled}>
        {t('common.prev')}
      </Button>
      <Button size="small" variant="outlined" onClick={() => onPageChange(page + 1)} disabled={!canNext || disabled}>
        {t('common.next')}
      </Button>
    </Stack>
  );
}
