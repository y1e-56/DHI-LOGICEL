import type { MouseEvent } from "react";

/**
 * Elements interactifs imbriques : un clic sur l'un d'eux ne doit PAS declencher
 * la navigation du conteneur cliquable (ligne de tableau, carte…).
 */
const INTERACTIVE_SELECTOR =
  "a,button,input,textarea,select,label,[role='combobox'],[role='menuitem'],[data-row-ignore]";

/**
 * Vrai si le clic provient d'un element interactif imbrique : dans ce cas le
 * conteneur cliquable doit l'ignorer et laisser l'element gerer l'evenement.
 */
export function isInteractiveClick(event: MouseEvent): boolean {
  const target = event.target as HTMLElement | null;
  return Boolean(target?.closest(INTERACTIVE_SELECTOR));
}
