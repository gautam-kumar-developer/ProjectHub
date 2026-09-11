"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

function SheetContent({
  className,
  children,
  onClose,
  side = "right",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void; side?: "left" | "right" }) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 z-50 flex flex-col bg-card border-l border-border shadow-2xl animate-slide-in-right",
        side === "right" ? "right-0" : "left-0",
        "w-full max-w-lg",
        className
      )}
      {...props}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 z-10 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 p-6 pb-0", className)} {...props} />
);

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
  )
);
SheetTitle.displayName = "SheetTitle";

export { Sheet, SheetContent, SheetHeader, SheetTitle };
