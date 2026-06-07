import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-98 duration-200",
          {
            // Variants
            "bg-gradient-to-r from-primary to-accent text-white shadow-xs hover:translate-y-[-2px] hover:shadow-md active:translate-y-0": 
              variant === 'default',
            "bg-red-600 text-white shadow-xs hover:bg-red-500": 
              variant === 'destructive',
            "border border-border-custom bg-surface text-text-secondary shadow-xs hover:bg-surface-secondary hover:text-text-primary": 
              variant === 'outline',
            "bg-surface-secondary text-text-primary border border-border-custom hover:bg-border-custom": 
              variant === 'secondary',
            "hover:bg-surface-secondary hover:text-text-primary": 
              variant === 'ghost',
            "text-primary underline-offset-4 hover:underline": 
              variant === 'link',
            
            // Sizes
            "h-10 px-4 py-2": size === 'default',
            "h-8 rounded-md px-3 text-xs": size === 'sm',
            "h-11 rounded-md px-8": size === 'lg',
            "h-10 w-10": size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
