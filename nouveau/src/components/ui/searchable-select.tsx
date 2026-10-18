"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type SearchableOption = {
  value: string;
  label: React.ReactNode;
  /** Texte utilise pour la recherche par saisie. Defaut : le label si c'est un texte. */
  searchText?: string;
  disabled?: boolean;
};

export type SearchableSelectProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "onChange" | "value"
> & {
  value?: string | undefined;
  onValueChange?: (value: string) => void;
  options: SearchableOption[];
  /** Placeholder affiche dans le declencheur quand aucune valeur n'est selectionnee. */
  placeholder?: React.ReactNode;
  /** Contenu personnalise du declencheur (badge, pastille…) a la place du label. */
  displayValue?: React.ReactNode;
  searchPlaceholder?: string;
  emptyMessage?: React.ReactNode;
  contentClassName?: string;
  align?: "start" | "center" | "end";
};

/**
 * Liste deroulante POURVUE D'UN CHAMP DE RECHERCHE.
 *
 * Remplace `Select` : le declencheur reprend l'apparence de `SelectTrigger`,
 * mais le panneau ouvre un `CommandInput` qui filtre les options au fil de la
 * saisie. Meme API controlee que `Select` (`value` / `onValueChange`).
 */
export const SearchableSelect = React.forwardRef<HTMLButtonElement, SearchableSelectProps>(
  function SearchableSelect(
    {
      value,
      onValueChange,
      options,
      placeholder,
      displayValue,
      searchPlaceholder = "Rechercher…",
      emptyMessage = "Aucun résultat.",
      disabled,
      className,
      contentClassName,
      align = "start",
      ...props
    },
    ref,
  ) {
    const [open, setOpen] = React.useState(false);
    const selected = options.find((option) => option.value === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "flex h-8 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-background px-2.5 text-[13px] ring-offset-background cursor-pointer transition-colors hover:border-border-strong focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
            {...props}
          >
            <span
              className={cn(
                "line-clamp-1 text-left",
                !selected && !displayValue && "text-muted-foreground",
              )}
            >
              {displayValue ?? (selected ? selected.label : placeholder)}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          className={cn(
            "w-[var(--radix-popover-trigger-width)] min-w-[10rem] p-0",
            contentClassName,
          )}
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {options.map((option) => {
                const searchText =
                  option.searchText ??
                  (typeof option.label === "string" ? option.label : option.value);
                const isSelected = option.value === value;
                return (
                  <CommandItem
                    key={option.value || "__empty__"}
                    value={option.value || "__empty__"}
                    keywords={[searchText, option.value]}
                    disabled={option.disabled ?? false}
                    onSelect={() => {
                      onValueChange?.(option.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                    />
                    <span className="line-clamp-1">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
