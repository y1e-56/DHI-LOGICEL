import type { Product } from "@/lib/dhi-data";
import type { SelectOption, Store } from "./types";

/**
 * Champ « version » des formulaires produit / projet / campagne (CDC RG-005 :
 * tout projet et toute campagne visent une version determinee du produit).
 *
 * La liste propose les versions existantes du produit, plus « Nouvelle
 * version… » : ce choix ouvre une saisie libre, la version etant alors creee
 * pour le produit a l'enregistrement.
 */
export const NEW_VERSION = "__new__";

/** Versions connues d'un produit (numeros de ses releases). */
export const versionsOf = (store: Pick<Store, "products">, productId: string): string[] =>
  store.products.find((p) => p.id === productId)?.versions ?? [];

export function versionOptions(versions: string[], newLabel: string): SelectOption[] {
  return [...versions.map((v) => ({ value: v, label: v })), { value: NEW_VERSION, label: newLabel }];
}

/**
 * Choix par defaut : la version preferee si elle existe pour le produit, sinon
 * la plus recente, sinon « Nouvelle version… » (produit encore sans version).
 */
export function defaultVersionChoice(versions: string[], preferred?: string): string {
  if (preferred && versions.includes(preferred)) return preferred;
  return versions[versions.length - 1] ?? NEW_VERSION;
}

/** Numero de version retenu : la version choisie, ou la nouvelle saisie. */
export const resolveVersion = (choice: string, typed: string): string =>
  (choice === NEW_VERSION ? typed : choice).trim();

/** La version est obligatoire : vrai si aucun numero exploitable n'est fourni. */
export const versionMissing = (choice: string, typed: string): boolean =>
  resolveVersion(choice, typed) === "";

/** Ajoute une version a un produit dans la liste locale (si elle est nouvelle). */
export function withProductVersion(products: Product[], productId: string, version: string): Product[] {
  return products.map((p) =>
    p.id === productId && version && !p.versions.some((v) => v.toLowerCase() === version.toLowerCase())
      ? { ...p, versions: [...p.versions, version] }
      : p,
  );
}
