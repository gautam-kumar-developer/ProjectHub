"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = React.createContext<DropdownContextType>({
  open: false,
  setOpen: () => {},
});

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

function DropdownMenuTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = React.useContext(DropdownContext);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({
  className,
  align = "end",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" | "center" }) {
  const { open } = React.useContext(DropdownContext);
  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[180px] rounded-lg border border-border bg-popover p-1 shadow-lg animate-fade-in",
        align === "end" && "right-0",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuItem({
  className,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & { onClick?: () => void }) {
  const { setOpen } = React.useContext(DropdownContext);
  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent cursor-pointer text-left",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...props} />;
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel };
