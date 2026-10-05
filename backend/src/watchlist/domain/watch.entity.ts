export interface Watch {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  currency: string;
  // Mots-clés d'actualité choisis ; null = suggestion calculée depuis le nom.
  newsQuery: string | null;
  createdAt: Date;
}
