import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'gold' | 'outline' | 'soft' | 'text';
export type ButtonSize = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/40 ' +
  'disabled:bg-[#cdd0c8] disabled:text-[#7a8079] disabled:cursor-not-allowed';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-green-700 text-white hover:bg-green-800',
  gold: 'bg-gold-500 text-green-900 hover:bg-gold-600',
  outline: 'border-[1.5px] border-green-700 text-green-700 hover:bg-green-50',
  soft: 'bg-green-50 text-green-700 hover:bg-gold-50',
  text: 'text-green-700 hover:underline',
};

const sizes: Record<ButtonSize, string> = {
  md: 'px-[22px] py-3 text-[15px]',
  sm: 'px-4 py-2 text-sm',
};

/** Resolve as classes do botão (pura — testável sem render). */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return cn(base, variants[variant], sizes[size]);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return <button className={cn(buttonClasses(variant, size), className)} {...props} />;
}
