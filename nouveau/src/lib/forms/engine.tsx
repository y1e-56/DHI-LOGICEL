import { useState, type ChangeEvent, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type ControllerRenderProps,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScreenshotPicker, type ScreenshotPickerLabels } from "@/components/dhi/ScreenshotPicker";
import { MemberMultiSelect } from "@/components/dhi/MemberMultiSelect";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";
import type { EntityFormSchema, FieldSpec, FormCtl, FormRunContext, FormMode } from "./types";

type EntityFormProps<V extends FieldValues, E = undefined> = {
  schema: EntityFormSchema<V, E>;
  mode: FormMode;
  /** Id du domaine (local ou backend) en mode `update`. */
  id?: string;
  entity?: E;
  /** Valeurs imposees par le contexte d'entree (ex: produit/projet fixes quand
   *  on cree la campagne depuis une fiche projet). Le schema peut figer et
   *  masquer les champs correspondants. */
  seed?: Partial<V> | undefined;
  onCancel?: () => void;
  /** Appele apres enregistrement reussi, avant le toast de succes.
   *  Recoit l'identifiant retourne par `save` (navigation vers l'entite). */
  onSaved?: (saved?: string) => void;
  /** Barre d'outils rendue au-dessus du formulaire (import CSV, modeles…). */
  toolbar?: (ctl: FormCtl<V>) => ReactNode;
};

/** Secours si un schema fournit un champ `files` sans libelles (devrait pas). */
const FALLBACK_PICKER_LABELS: ScreenshotPickerLabels = {
  add: "Joindre",
  count: "{n} / {max}",
  remove: "Retirer",
  imageOnly: "",
  nonImageIgnored: "",
  tooBig: "",
  maxReached: "",
};

/**
 * Moteur de formulaire : interprete un schema de formulaire et rend le
 * formulaire complet (champs, erreurs au champ, sections, pied de page).
 *
 * Une route ne contient que son chrome (AppShell, panneau, retour) et cet
 * appel : ni validation, ni mappage backend, ni toast.error dedans.
 */
export function EntityForm<V extends FieldValues, E = undefined>({
  schema,
  mode,
  id,
  entity,
  seed,
  onCancel,
  onSaved,
  toolbar,
}: EntityFormProps<V, E>) {
  const { t } = useI18n();
  const store = useStore();
  const [busy, setBusy] = useState(false);

  const initValues = schema.defaults({ entity, ctx: { mode, t, store, entity, seed } });
  const form = useForm<V>({
    resolver: zodResolver(schema.validation({ mode, t, store, values: initValues, entity, seed })),
    // V est deja un objet complet : DeepPartial<V> n'est pas derivable pour un
    // generic, d'ou le cast vers DefaultValues<V>.
    defaultValues: initValues as DefaultValues<V>,
  });
  const ctl: FormCtl<V> = {
    setValue: (name, value) => form.setValue(name, value as never),
    getValues: () => form.getValues() as V,
    reset: (values) => form.reset(values as DefaultValues<V>),
  };

  // Suivi du formulaire : les options de liste et le titre voient les valeurs
  // courantes (re-rendu a chaque frappe via form.watch).
  const ctx: FormRunContext<V, E> = { mode, t, store, values: form.watch(), entity, seed };
  const fields = schema.fields(ctx).filter((field) => !field.when || field.when(ctx));
  const groups = layoutGroups(fields);
  const title = schema.title(ctx);
  const subtitle = schema.subtitle?.(ctx);

  const submit = form.handleSubmit(async (values: V) => {
    setBusy(true);
    try {
      // Chemin d'ecriture : le jeton et la forme de l'id disent si l'entite
      // vit en base. Une erreur remonte a l'appelant — pas de verdict de
      // succes pour un enregistrement perdu.
      const online =
        typeof localStorage !== "undefined" &&
        Boolean(localStorage.getItem("token")) &&
        (mode === "create" || /^\d+$/.test(id ?? ""));
      const saved = await schema.save({ values, mode, id, online, store, t });
      const notice = schema.successMessage(
        { mode, t, store, values, entity, online, seed },
        typeof saved === "string" ? saved : undefined,
      );
      if (typeof notice === "string") {
        toast.success(notice);
      } else if (notice.kind === "warning") {
        toast.warning(notice.message, notice.duration ? { duration: notice.duration } : undefined);
      } else {
        toast.success(notice.message);
      }
      onSaved?.(typeof saved === "string" ? saved : undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.erreur"));
    } finally {
      setBusy(false);
    }
  });

  return (
    <Form {...form}>
      {toolbar ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">{toolbar(ctl)}</div>
      ) : null}
      <form onSubmit={submit} className="max-w-4xl space-y-8">
        <div className="space-y-4">
          {title ? (
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
          ) : null}

          <div className="grid gap-4">
            {groups.map((group) => {
              const section = group[0]?.section;
              const width = group[0]?.width;
              return (
                <div key={group.map((field) => field.name).join("-")}>
                  {section ? (
                    <div className="space-y-1 pb-1 pt-2">
                      <h3 className="text-sm font-semibold tracking-tight">{section.label(ctx)}</h3>
                      {section.hint ? (
                        <p className="text-xs text-muted-foreground">{section.hint(ctx)}</p>
                      ) : null}
                    </div>
                  ) : null}
                  <div
                    className={
                      group.length > 1
                        ? width === "third"
                          ? "grid gap-4 sm:grid-cols-3"
                          : "grid grid-cols-2 gap-4"
                        : "grid gap-2"
                    }
                  >
                    {group.map((field) => (
                      <FieldRow key={field.name} field={field} ctx={ctx} form={form} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-4">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} className="h-11 px-6">
              {t("actions.annuler")}
            </Button>
          ) : null}
          <Button type="submit" disabled={busy} className="h-11 px-6">
            {schema.submitLabel(ctx)}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/**
 * Alterne full/half/third : deux `half` consecutifs partagent une ligne de
 * deux colonnes, trois `third` une ligne de trois (sm:grid-cols-3), comme le
 * gabarit des pages d'origine. Un champ `section` ouvre toujours un groupe.
 */
function layoutGroups<V extends FieldValues>(fields: FieldSpec<V>[]): FieldSpec<V>[][] {
  const groups: FieldSpec<V>[][] = [];
  for (const field of fields) {
    const width = field.width ?? "full";
    if (field.section || width === "full") {
      groups.push([field]);
      continue;
    }
    const last = groups.at(-1);
    const capacity = width === "third" ? 3 : 2;
    if (last && last.length < capacity && last[0]?.width === width) {
      last.push(field);
      continue;
    }
    groups.push([field]);
  }
  return groups;
}

function FieldRow<V extends FieldValues>({
  field,
  ctx,
  form,
}: {
  field: FieldSpec<V>;
  ctx: FormRunContext<V>;
  form: UseFormReturn<V>;
}) {
  const labelText = field.label(ctx);
  const optional = field.optional?.(ctx);
  const helpText = field.helpText?.(ctx);
  const fire = (value: unknown) =>
    field.onChange?.({
      value,
      ctx,
      setValue: (name, next) => form.setValue(name, next as never),
      getValues: () => form.getValues() as V,
    });

  // Case a cocher seule : le texte du libelle vit a cote de la case, comme
  // un reglage binaire, pas au-dessus comme les autres champs.
  if (field.type === "checkbox") {
    return (
      <FormField<V>
        control={form.control}
        name={field.name}
        render={({ field: rhf }) => (
          <FormItem className="flex flex-row items-center gap-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={Boolean(rhf.value)}
                disabled={rhf.disabled || field.disabled?.(ctx)}
                onCheckedChange={(checked) => {
                  const next = checked === true;
                  rhf.onChange(next);
                  fire(next);
                }}
              />
            </FormControl>
            <FormLabel className="mb-0 font-normal">{labelText}</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Captures justificatives : le libelle et le conseil vivent dans la boite,
  // pas au-dessus — la preuve est un bloc distinct, comme sur les pages d'origine.
  if (field.type === "files") {
    return (
      <FormField<V>
        control={form.control}
        name={field.name}
        render={({ field: rhf }) => (
          <FormItem className="space-y-2 rounded-md border border-border p-4">
            <FormLabel>{labelText}</FormLabel>
            {helpText ? <p className="text-sm text-muted-foreground">{helpText}</p> : null}
            <FormControl>
              <ScreenshotPicker
                labels={field.fileLabels?.(ctx) ?? FALLBACK_PICKER_LABELS}
                onChange={(files) => {
                  rhf.onChange(files);
                  fire(files);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField<V>
      control={form.control}
      name={field.name}
      render={({ field: rhf }) => (
        <FormItem>
          <FormLabel>
            {labelText}
            {optional ? (
              <span className="font-normal text-muted-foreground"> ({optional})</span>
            ) : null}
          </FormLabel>
          <FormControl>{renderControl(field, ctx, rhf, fire)}</FormControl>
          {helpText ? <p className="text-[11px] text-muted-foreground">{helpText}</p> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function renderControl<V extends FieldValues>(
  field: FieldSpec<V>,
  ctx: FormRunContext<V>,
  rhf: ControllerRenderProps<V, Path<V>>,
  fire: (value: unknown) => void,
): ReactNode {
  const disabled = rhf.disabled || field.disabled?.(ctx);
  const placeholder = field.placeholder?.(ctx);

  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          rows={field.rows ?? 4}
          placeholder={placeholder}
          disabled={disabled}
          value={(rhf.value as string) ?? ""}
          onChange={(event) => {
            rhf.onChange(event);
            fire(event.target.value);
          }}
          onBlur={rhf.onBlur}
        />
      );
    case "password":
      return (
        <PasswordInput
          id={rhf.name}
          placeholder={placeholder}
          disabled={disabled}
          value={(rhf.value as string) ?? ""}
          onChange={rhf.onChange}
          onBlur={rhf.onBlur}
          ctx={ctx}
        />
      );
    case "select":
      return (
        <SearchableSelect
          value={(rhf.value as string) ?? ""}
          onValueChange={(next) => {
            rhf.onChange(next);
            fire(next);
          }}
          options={field.options?.(ctx) ?? []}
          placeholder={placeholder}
          disabled={disabled ?? false}
          className="h-11"
        />
      );
    case "date":
      return (
        <Input
          type="date"
          className="h-11"
          disabled={disabled}
          min={field.min?.(ctx)}
          max={field.max?.(ctx)}
          value={(rhf.value as string) ?? ""}
          onChange={(event) => {
            rhf.onChange(event);
            fire(event.target.value);
          }}
          onBlur={rhf.onBlur}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          className="h-11"
          min={field.number?.min}
          max={field.number?.max}
          step={field.number?.step}
          disabled={disabled}
          value={rhf.value === undefined || rhf.value === null ? "" : String(rhf.value)}
          onChange={(event) => {
            const raw = event.target.value;
            // Sans bornes, une valeur vide efface le champ. Avec des bornes
            // (progression 0-100), on garde un nombre et on ecrete au lieu de
            // laisser passer `undefined` ou une valeur hors plage.
            if (!field.number) {
              const next = raw === "" ? undefined : Number(raw);
              rhf.onChange(next);
              fire(next);
              return;
            }
            let next = raw === "" ? 0 : Number(raw);
            if (Number.isNaN(next)) next = 0;
            if (field.number.min !== undefined) next = Math.max(field.number.min, next);
            if (field.number.max !== undefined) next = Math.min(field.number.max, next);
            rhf.onChange(next);
            fire(next);
          }}
          onBlur={rhf.onBlur}
        />
      );
    case "multiselect": {
      const selected: string[] = Array.isArray(rhf.value) ? (rhf.value as string[]) : [];
      const options = field.options?.(ctx) ?? [];
      const toggle = (value: string) => {
        const next = selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value];
        rhf.onChange(next);
        fire(next);
      };
      return (
        <div className="space-y-2">
          {field.counter ? (
            <p className="text-xs text-muted-foreground">
              {field.counter({ selected: selected.length, total: options.length })}
            </p>
          ) : null}
          <div
            className={cn(
              "gap-2",
              field.columns === 2 ? "grid sm:grid-cols-2" : "grid",
              field.scrollable && "max-h-56 overflow-y-auto pr-1",
              field.scrollable && "rounded-md border border-border bg-subtle/50 p-3",
            )}
          >
            {options.length === 0 && field.emptyText ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {field.emptyText(ctx)}
              </p>
            ) : null}
            {options.map((option) => (
              <div
                key={option.value || "__empty__"}
                role="button"
                tabIndex={option.disabled ? -1 : 0}
                aria-pressed={selected.includes(option.value)}
                onClick={() => {
                  if (!option.disabled) toggle(option.value);
                }}
                onKeyDown={(event) => {
                  if (!option.disabled && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    toggle(option.value);
                  }
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md text-xs",
                  field.borderless ? "px-1.5 py-1 hover:bg-primary/5" : "border border-border p-2",
                  option.disabled && "opacity-50",
                )}
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  disabled={option.disabled}
                  onClick={(event) => event.stopPropagation()}
                  onCheckedChange={() => toggle(option.value)}
                />
                <span className="min-w-0 flex-1 leading-tight">
                  <span>{option.label}</span>
                  {field.hint ? (
                    <span className="block text-xs text-muted-foreground">
                      {field.hint(option)}
                    </span>
                  ) : null}
                </span>
                {field.badge ? <span className="shrink-0">{field.badge(option)}</span> : null}
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "members": {
      const member = field.member;
      const placeholder = member?.placeholder?.(ctx);
      const value = rhf.value as unknown;
      return (
        <MemberMultiSelect
          value={value instanceof Set ? value : new Set<string>()}
          onChange={(next) => {
            rhf.onChange(next);
            fire(next);
          }}
          options={member?.options(ctx) ?? []}
          showRole={member?.showRole ?? true}
          selectionLabel={
            member?.selectionLabel(ctx) ?? { label: "Membre", labelPlural: "Membres" }
          }
          {...(placeholder !== undefined ? { placeholder } : {})}
        />
      );
    }
    case "text":
    default:
      return (
        <Input
          type="text"
          className="h-11"
          placeholder={placeholder}
          disabled={disabled}
          value={(rhf.value as string) ?? ""}
          onChange={(event) => {
            rhf.onChange(event);
            fire(event.target.value);
          }}
          onBlur={rhf.onBlur}
        />
      );
  }
}

function PasswordInput<V extends FieldValues>({
  id,
  value,
  placeholder,
  disabled,
  onChange,
  onBlur,
  ctx,
}: {
  id: string;
  value: string;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  ctx: FormRunContext<V>;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        className="h-11 pr-11"
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3"
        aria-label={ctx.t(visible ? "login.cacher_mdp" : "login.afficher_mdp")}
        title={ctx.t(visible ? "login.cacher_mdp" : "login.afficher_mdp")}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}
