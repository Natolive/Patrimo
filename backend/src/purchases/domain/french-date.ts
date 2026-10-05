// AAAA-MM-JJ → JJ/MM/AAAA, pour les messages d'erreur.
export const frenchDate = (date: string) => date.split('-').reverse().join('/');
