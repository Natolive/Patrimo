// Article d'actualité : titre et lien seulement, l'article reste chez son éditeur.
export interface NewsItemDto {
  title: string
  url: string
  source: string
  // Site de l'éditeur (ex. boursorama.com), pour afficher son logo ; vide s'il est inconnu.
  sourceDomain: string
  publishedAt: string
}
