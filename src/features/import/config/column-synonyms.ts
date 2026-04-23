export const COLUMN_SYNONYMS: Record<string, string[]> = {
  title: ['titulo', 'título', 'title', 'nombre', 'nombre libro', 'nombre del libro'],
  author: ['autor', 'author', 'autores', 'authors', 'nombre autor'],
  isbn: ['isbn', 'isbn13', 'isbn10', 'isbn-13', 'isbn-10', 'codigo isbn', 'código isbn'],
  sku: ['sku', 'codigo', 'código', 'codigo propio', 'código propio', 'referencia', 'ref', 'id'],
  stock_quantity: ['ejemplares', 'copias', 'cantidad', 'stock', 'copies', 'quantity', 'existencias', 'total'],
  min_stock: ['ejemplares minimos', 'ejemplares mínimos', 'minimo', 'mínimo', 'stock minimo', 'min'],
  publisher: ['editorial', 'publisher', 'publicado por', 'published by'],
  year: ['año', 'anio', 'year', 'fecha', 'fecha publicacion', 'fecha de publicación', 'published date'],
  pages: ['paginas', 'páginas', 'pages', 'num paginas'],
  category: ['categoria', 'categoría', 'category', 'genero', 'género', 'genre', 'tipo'],
  cost_price: ['costo', 'cost', 'precio costo', 'precio de costo'],
  sale_price: ['precio', 'price', 'precio venta', 'precio de venta', 'sale price'],
};

export const IMPORTABLE_FIELDS = [...Object.keys(COLUMN_SYNONYMS), 'notes'] as const;

export type ImportableField = (typeof IMPORTABLE_FIELDS)[number];

export function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function autoDetectField(header: string): ImportableField | 'ignore' {
  const normalized = normalizeHeader(header);

  for (const [field, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
    if (synonyms.some((synonym) => normalizeHeader(synonym) === normalized)) {
      return field as ImportableField;
    }
  }

  return 'ignore';
}
