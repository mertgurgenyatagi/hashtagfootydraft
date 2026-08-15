import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'quiet'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-display font-medium uppercase leading-none tracking-[0.09em] transition duration-150 ease-out'

/** Two shapes, one colour: a filled gold pill is primary, an outline is not.
 *  Disabled primary drops to a flat surface rather than dimmed gold — dimming
 *  gold turns it muddy and drags its near-black label below readable contrast. */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent px-8 py-3.5 text-accent-ink hover:-translate-y-px hover:brightness-95 active:translate-y-0 active:brightness-90 disabled:border disabled:border-line disabled:bg-surface disabled:text-muted disabled:hover:translate-y-0 disabled:hover:brightness-100',
  ghost:
    'border border-line px-8 py-3.5 text-ink hover:border-ink/35 hover:bg-surface disabled:opacity-45',
  quiet: 'px-2 py-1 text-[0.78rem] text-muted hover:text-ink disabled:text-muted/55',
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
