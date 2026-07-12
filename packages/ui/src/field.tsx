import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';
import { cn } from './cn';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  error?: string;
}

/** Campo com label e estado de erro (DS §7). Foco com halo verde. */
export function Field({ label, error, className, id, ...props }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(
          'rounded-[10px] border-[1.5px] border-border px-3.5 py-3 text-[15px] text-ink outline-none',
          'focus:border-green-700 focus:ring-4 focus:ring-green-700/[0.13]',
          error && 'border-error',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-error">{error}</span> : null}
    </div>
  );
}
