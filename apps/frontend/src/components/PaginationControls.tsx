import { Button, Stack, Typography } from '@mui/material';

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
  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" sx={{ mt: 1 }}>
      <Typography variant="caption">Page {pages ? page : 0} of {pages}</Typography>
      <Button size="small" variant="outlined" onClick={() => onPageChange(page - 1)} disabled={!canPrev || disabled}>
        Prev
      </Button>
      <Button size="small" variant="outlined" onClick={() => onPageChange(page + 1)} disabled={!canNext || disabled}>
        Next
      </Button>
    </Stack>
  );
}

