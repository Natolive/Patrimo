// Séance d'une place : la prochaine ou celle en cours, sinon la dernière ; `lastSession` = date locale de la dernière séance cotée.
export interface TradingSession {
  start: Date;
  end: Date;
  lastSession: string;
}
