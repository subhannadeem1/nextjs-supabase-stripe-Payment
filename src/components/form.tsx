"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countryOptions, flagEmoji, countryName } from "@/lib/countries";
import { cn } from "@/lib/utils";

const NONE = "__none__";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SelectField<V extends string>({
  value,
  onChange,
  options,
  placeholder = "Select…",
  allowEmpty,
  emptyLabel = "None",
  className,
  size,
  id,
}: {
  value: V | "";
  onChange: (v: V | "") => void;
  options: readonly { value: V; label: string }[];
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  size?: "sm" | "default";
  id?: string;
}) {
  return (
    <Select
      value={value === "" ? (allowEmpty ? NONE : undefined) : value}
      onValueChange={(v) => onChange(v === NONE ? "" : (v as V))}
    >
      <SelectTrigger id={id} className={className} size={size}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty ? <SelectItem value={NONE}>{emptyLabel}</SelectItem> : null}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Toggle chips for small multi-select lists (segments, opportunities). */
export function ChipsSelect({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors",
              on
                ? "border-transparent bg-brand text-white shadow-brand"
                : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {on ? <Check className="size-3" /> : null}
            {o}
          </button>
        );
      })}
    </div>
  );
}

/** Free-text tags: type and press Enter. */
export function TagsInput({ value, onChange, placeholder = "Add tag and press Enter" }: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText("");
  };
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2 py-1.5 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !text && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={value.length ? "" : placeholder}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
      />
    </div>
  );
}

/** Searchable single select (countries, companies, projects). */
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "Nothing found.",
  allowClear = true,
  renderOption,
  className,
  disabled,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; keywords?: string[] }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowClear?: boolean;
  renderOption?: (o: { value: string; label: string }) => React.ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between px-3 font-normal", !selected && "text-muted-foreground/80", className)}
        >
          <span className="truncate">
            {selected ? (renderOption ? renderOption(selected) : selected.label) : placeholder}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command
          filter={(itemValue, search, keywords) => {
            const hay = `${itemValue} ${(keywords ?? []).join(" ")}`.toLowerCase();
            return hay.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allowClear && value ? (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  <X /> Clear
                </CommandItem>
              ) : null}
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={`${o.label} ${o.value}`}
                  keywords={o.keywords}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4", o.value === value ? "opacity-100" : "opacity-0")} />
                  {renderOption ? renderOption(o) : o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function CountrySelect({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  const options = countryOptions().map((c) => ({ value: c.code, label: c.name }));
  return (
    <Combobox
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select country"
      searchPlaceholder="Search country…"
      renderOption={(o) => (
        <span className="flex items-center gap-2">
          <span>{flagEmoji(o.value)}</span>
          {o.label}
        </span>
      )}
    />
  );
}

export function CountryLabel({ code, city }: { code: string; city?: string }) {
  if (!code && !city) return <span className="text-muted-foreground/60">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      {code ? <span>{flagEmoji(code)}</span> : null}
      <span className="truncate">{[countryName(code), city].filter(Boolean).join(" · ")}</span>
    </span>
  );
}
