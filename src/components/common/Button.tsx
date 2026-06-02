import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'full'
  children: ReactNode
  icon?: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary text-text-inverse rounded-[4px] hover:bg-primary-dark',
    secondary: 'bg-bg-secondary text-text-primary rounded-[4px] hover:bg-bg-tertiary',
    outline: 'border border-border-default bg-bg-primary text-text-primary rounded-[4px] hover:bg-bg-secondary',
    ghost: 'text-text-secondary hover:text-text-primary',
  }

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-5 text-base',
    lg: 'h-[52px] px-6 text-base',
    full: 'h-[52px] w-full px-6 text-base',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  )
}
