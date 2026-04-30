export const FIELD_DEFINITIONS = {
  title: {
    label: "Título",
    section: "main",
    synonyms: ["titulo", "título", "title", "nombre", "nombre libro", "nombre del libro"],
  },
  author: {
    label: "Autor",
    section: "main",
    synonyms: ["autor", "author", "autores", "authors", "nombre autor"],
  },
  isbn: {
    label: "ISBN",
    section: "main",
    synonyms: ["isbn", "isbn13", "isbn10", "isbn-13", "isbn-10", "codigo isbn", "código isbn"],
  },
  sku: {
    label: "SKU / Identificador interno",
    section: "main",
    synonyms: [
      "sku",
      "codigo",
      "código",
      "codigo propio",
      "código propio",
      "referencia",
      "ref",
      "id",
      "numeroadquisicion",
      "num. adq.",
      "núm. adq.",
      "núm.  adq.",
      "número adquisición",
      "num. de etiqueta inventario",
      "núm. de etiqueta inventario",
      "num etiqueta inventario",
    ],
  },
  stock_quantity: {
    label: "Ejemplares",
    section: "main",
    synonyms: ["ejemplares", "copias", "cantidad", "stock", "copies", "quantity", "existencias", "total"],
  },
  category: {
    label: "Categoría principal",
    section: "main",
    synonyms: ["categoria", "categoría", "category", "genero", "género", "genre", "tipo"],
  },
  facet_material: {
    label: "Material",
    section: "facet",
    synonyms: ["material", "tipo material", "tipo de material"],
  },
  facet_biblioteca: {
    label: "Biblioteca",
    section: "facet",
    synonyms: ["biblioteca", "sede", "sucursal"],
  },
  facet_coleccion: {
    label: "Colección",
    section: "facet",
    synonyms: ["coleccion", "colección"],
  },
  facet_clasificacion: {
    label: "Clasificación",
    section: "facet",
    synonyms: ["clasificacion", "clasificación"],
  },
  additional_publisher: {
    label: "Editorial",
    section: "additional",
    synonyms: ["editorial", "publisher", "publicado por", "published by"],
  },
  additional_year: {
    label: "Año / Fecha",
    section: "additional",
    synonyms: ["año", "anio", "year", "fecha", "fecha publicacion", "fecha de publicación", "published date", "año edición"],
  },
  additional_pages: {
    label: "Páginas",
    section: "additional",
    synonyms: ["paginas", "páginas", "pages", "num paginas", "núm. de págs.", "num. de págs."],
  },
  additional_acquisition_number: {
    label: "Núm. adquisición",
    section: "additional",
    synonyms: ["num adquisicion", "núm. adquisición", "número adquisición", "num adquisicion", "num adq", "núm adq"],
  },
  additional_record_number: {
    label: "Núm. ficha / interno",
    section: "additional",
    synonyms: ["numficha", "num. interno para histórico", "núm. interno para histórico", "núm. libro", "numero interno"],
  },
  additional_volume: {
    label: "Volumen",
    section: "additional",
    synonyms: ["volumen"],
  },
  additional_tome: {
    label: "Tomo",
    section: "additional",
    synonyms: ["tomo"],
  },
  additional_notes: {
    label: "Notas visibles",
    section: "additional",
    synonyms: ["notas", "nota", "contiene nota", "observaciones"],
  },
} as const;

export type ImportableField = keyof typeof FIELD_DEFINITIONS;
export type FieldSection = (typeof FIELD_DEFINITIONS)[ImportableField]["section"];
export type MainImportField = Extract<
  ImportableField,
  "title" | "author" | "isbn" | "sku" | "stock_quantity" | "category"
>;

export const IMPORTABLE_FIELDS = Object.keys(FIELD_DEFINITIONS) as ImportableField[];
export const MAIN_IMPORT_FIELDS: MainImportField[] = [
  "title",
  "author",
  "isbn",
  "sku",
  "stock_quantity",
  "category",
];

export function getFieldLabel(field: ImportableField) {
  return FIELD_DEFINITIONS[field].label;
}

export function getFieldSection(field: ImportableField) {
  return FIELD_DEFINITIONS[field].section;
}

export function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function autoDetectField(header: string): ImportableField | "ignore" {
  const normalized = normalizeHeader(header);

  for (const [field, definition] of Object.entries(FIELD_DEFINITIONS)) {
    if (definition.synonyms.some((synonym) => normalizeHeader(synonym) === normalized)) {
      return field as ImportableField;
    }
  }

  return "ignore";
}

export function getHeaderDisplayLabel(header: string) {
  const detected = autoDetectField(header);
  if (detected !== "ignore") {
    return getFieldLabel(detected);
  }

  const normalized = normalizeHeader(header);
  if (!normalized) return header;

  return normalized
    .split(" ")
    .map((word) => {
      if (word === "isbn") return "ISBN";
      if (word === "sku") return "SKU";
      if (word === "num" || word === "numero") return "Núm.";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
