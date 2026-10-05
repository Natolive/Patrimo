// Clôture d'une séance ; `date` au format AAAA-MM-JJ, heure de la place de cotation.
export interface PricePoint {
  date: string;
  close: number;
}
