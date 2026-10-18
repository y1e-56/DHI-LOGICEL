import type { ReactNode } from "react";
import type { FieldValues, Path } from "react-hook-form";
import type { ZodType } from "zod";
import type { ScreenshotPickerLabels } from "@/components/dhi/ScreenshotPicker";
import type { MemberOption, MemberSelection } from "@/components/dhi/MemberMultiSelect";
import type { useStore } from "@/lib/dhi-store";
import type { TranslationKey } from "@/lib/i18n";

export type FormMode = "create" | "update";

export type Store = ReturnType<typeof useStore>;

export type Translator = (key: TranslationKey) => string;

/**
 * Contexte d'execution fourni par le moteur aux fonctions du schema.
 * Toute adaptation (options de liste, libelles, validation) en derive :
 * le schema ne lit ni le store, ni le mode, ni i18n en direct.
 *
 * `values` est le formulaire suivi en direct : c'est lui qui permet aux
 * options d'une liste de tenir compte de la valeur courante du champ
 * (sansMe conserve la selection enregistree, par exemple).
 * `entity` est l'entite en modification (absente en creation).
 */
export type FormRunContext<V = FieldValues, E = unknown> = {
  mode: FormMode;
  t: Translator;
  store: Store;
  values: V;
  entity?: E | undefined;
  /** Renseigne uniquement a la soumission (dans successMessage) : dit si
   *  l'enregistrement est parti en base ou est reste local. */
  online?: boolean;
  /** Valeurs imposees par le contexte d'entree — ex: creation d'une campagne
   *  depuis la fiche projet (`projectId`), creation d'un projet depuis une
   *  fiche produit (`productId`). Le schema peut figer et masquer les champs
   *  correspondants et pre-remplir ses valeurs par defaut. */
  seed?: Partial<V> | undefined;
};

/**
 * Contexte d'initialisation : memes sources que `FormRunContext` mais avant
 * qu'un formulaire n'existe — utilise par `defaults`.
 */
export type FormInitContext<V = FieldValues, E = unknown> = Omit<FormRunContext<V, E>, "values">;

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

/** Arguments d'un changement de valeur : le schema peut cascader d'autres champs. */
export type FieldChangeArgs<V> = {
  value: unknown;
  ctx: FormRunContext<V>;
  /** Ecrit une valeur brute dans le formulaire (cast gere par le moteur). */
  setValue: (name: Path<V>, value: unknown) => void;
  getValues: () => V;
};

export type FieldSpec<V> = {
  name: Path<V>;
  type:
    | "text"
    | "textarea"
    | "select"
    | "date"
    | "number"
    | "password"
    | "checkbox"
    | "multiselect"
    /** Fichiers justificatifs (captures d'ecran) : rendus par le ScreenshotPicker. */
    | "files"
    /** Selection de membres (Set de noms) : rendue par le MemberMultiSelect. */
    | "members";
  label: (ctx: FormRunContext<V>) => string;
  /** `files` uniquement : libelles i18n du ScreenshotPicker (ajout, compteur, rejets…). */
  fileLabels?: (ctx: FormRunContext<V>) => ScreenshotPickerLabels;
  /** `members` uniquement : options et libelles du MemberMultiSelect. */
  member?: {
    options: (ctx: FormRunContext<V>) => MemberOption[];
    showRole?: boolean;
    placeholder?: (ctx: FormRunContext<V>) => string;
    selectionLabel: (ctx: FormRunContext<V>) => MemberSelection;
  };
  /** Champ rendu seulement si la condition est vraie (clone conditionnel…). */
  when?: (ctx: FormRunContext<V>) => boolean;
  placeholder?: (ctx: FormRunContext<V>) => string;
  options?: (ctx: FormRunContext<V>) => SelectOption[];
  /** `half` se colle au `half` precedent : deux champs forment une ligne de deux colonnes.
   *  `third` se colle aux `third` precedents : jusqu'a trois par ligne (sm:grid-cols-3). */
  width?: "full" | "half" | "third";
  disabled?: (ctx: FormRunContext<V>) => boolean;
  /** Entete de section rendu avant ce champ (le champ ouvre une nouvelle section). */
  section?: {
    label: (ctx: FormRunContext<V>) => string;
    hint?: (ctx: FormRunContext<V>) => string;
  };
  /** Declenche une cascade quand le champ change (reinitialisation de selection liee). */
  onChange?: (args: FieldChangeArgs<V>) => void;
  rows?: number;
  /** Bornes du champ date (attributs min/max du control). */
  min?: (ctx: FormRunContext<V>) => string | undefined;
  max?: (ctx: FormRunContext<V>) => string | undefined;
  number?: { min?: number; max?: number; step?: number };
  /** Rendu riche des options d'un `multiselect` (badge, hint). */
  hint?: (option: SelectOption) => string;
  badge?: (option: SelectOption) => ReactNode;
  /** Compteur au-dessus des cases : « {n} / {total} … ». */
  counter?: (args: { selected: number; total: number }) => string;
  /** `multiselect` : 2 colonnes (defaut 1) + zone defileante. */
  columns?: 1 | 2;
  scrollable?: boolean;
  /** `multiselect` : lignes sans bordure (rangee de cases) plutot que cartes. */
  borderless?: boolean;
  /** `multiselect` : texte centre quand la liste est vide. */
  emptyText?: (ctx: FormRunContext<V>) => string;
  /** Aide sous le control (« automatique si aucune campagne », « base sur… »). */
  helpText?: (ctx: FormRunContext<V>) => string | undefined;
  /** Suffixe de libelle « (optionnel) », rendu en gris dans le label. */
  optional?: (ctx: FormRunContext<V>) => string;
};

/**
 * Chemin d'ecriture : le moteur calcule `online` (jeton present et id backend
 * valide) avant d'appeler `save`. Le schema ne voit jamais localStorage.
 */
export type SaveArgs<V> = {
  values: V;
  mode: FormMode;
  id?: string | undefined;
  online: boolean;
  store: Store;
  t: Translator;
};

/** `save` peut retourner un identifiant (ex: id genere) consomme par successMessage. */
export type SaveResult = string | void;

/** Notice de fin : succes (defaut) ou avertissement (mode degrade, hors ligne). */
export type FormNotice =
  string | { message: string; kind?: "success" | "warning"; duration?: number };

/**
 * Acces direct au formulaire pour une barre d'outils exterieure (import CSV,
 * modeles…). `reset` remplace toutes les valeurs en une passe.
 */
export type FormCtl<V> = {
  setValue: (name: Path<V>, value: unknown) => void;
  getValues: () => V;
  reset: (values: V) => void;
};

export type EntityFormSchema<V extends FieldValues, E = undefined> = {
  /** Chaine vide : le moteur n'affiche pas de titre. */
  title: (ctx: FormRunContext<V, E>) => string;
  subtitle?: (ctx: FormRunContext<V, E>) => string;
  fields: (ctx: FormRunContext<V, E>) => FieldSpec<V>[];
  validation: (ctx: FormRunContext<V, E>) => ZodType<V>;
  /** `defaults` tourne avant que le formulaire existe : pas de `values` ici. */
  defaults: (args: { entity?: E | undefined; ctx: FormInitContext<V, E> }) => V;
  save: (args: SaveArgs<V>) => Promise<SaveResult>;
  submitLabel: (ctx: FormRunContext<V, E>) => string;
  /** Notice de fin construite par le schema : elle peut interpoler les valeurs,
   *  l'entite (dans le contexte), le chemin d'ecriture (`ctx.online`) et
   *  l'identifiant retourne par `save`. */
  successMessage: (ctx: FormRunContext<V, E>, saved?: string) => FormNotice;
};
