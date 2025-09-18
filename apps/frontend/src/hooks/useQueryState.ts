import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

type Parser<T> = {
  toString: (v: T) => string;
  fromString: (s: string | null) => T;
};

const stringParser: Parser<string> = {
  toString: (v) => v,
  fromString: (s) => s ?? '',
};

const numberParser: Parser<number> = {
  toString: (v) => String(v ?? ''),
  fromString: (s) => {
    const n = s == null || s === '' ? NaN : Number(s);
    return Number.isFinite(n) ? n : 0;
  },
};

export function useQueryState<T>(key: string, initial: T, type: 'string' | 'number' = 'string') {
  const [params, setParams] = useSearchParams();

  const parser: Parser<any> = type === 'number' ? numberParser : stringParser;

  const value: T = useMemo(() => {
    const current = params.get(key);
    return (current == null ? initial : parser.fromString(current)) as T;
  }, [params, key, initial, parser]);

  const setValue = useCallback(
    (v: T) => {
      const next = new URLSearchParams(params);
      const str = parser.toString(v);
      if (!str) next.delete(key);
      else next.set(key, str);
      setParams(next, { replace: true });
    },
    [params, setParams, key, parser]
  );

  return [value, setValue] as const;
}

