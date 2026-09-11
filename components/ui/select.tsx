"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
}

function Select({ value, onValueChange, children, placeholder, className }: SelectProps) {
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

  const options: { value: string; label: string }[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<{ value: string; children: React.ReactNode }>(child)) {
      options.push({ value: child.props.value, label: String(child.props.children) });
    }
  });

  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder || "Select...";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
      >
        <span className={cn(!value && "text-muted-foreground")}>{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover p-1 shadow-lg animate-fade-in">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent cursor-pointer",
                value === option.value && "bg-accent font-medium"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectOption({ value, children }: { value: string; children: React.ReactNode }) {
  return null;
}

export { Select, SelectOption };
