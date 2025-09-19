import { Skeleton, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

// Full table skeleton (use in place of entire <Table> when needed)
export function TableSkeleton({ rows = 5, cols = 3 }: { rows?: number; cols?: number }) {
  const cells = Array.from({ length: cols });
  const lines = Array.from({ length: rows });
  return (
    <Table>
      <TableHead>
        <TableRow>
          {cells.map((_, i) => (
            <TableCell key={i}><Skeleton width={120} height={16} /></TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {lines.map((_, r) => (
          <TableRow key={r}>
            {cells.map((_, c) => (
              <TableCell key={c}><Skeleton height={18} /></TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Row-only skeletons to render inside an existing <TableBody>
export function TableSkeletonRows({ rows = 5, cols = 3 }: { rows?: number; cols?: number }) {
  const cells = Array.from({ length: cols });
  const lines = Array.from({ length: rows });
  return (
    <>
      {lines.map((_, r) => (
        <TableRow key={r}>
          {cells.map((_, c) => (
            <TableCell key={c}><Skeleton height={18} /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
