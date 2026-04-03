export const ATTRIBUTE_SCHEMAS = {
    pharmacy: [
      'manufacturer', 'dosage', 'form', 'requires_prescription', 'expiry_date',
      'storage_conditions', 'ppb_registration_number', 'drug_class', 'side_effects',
      'usage_instructions', 'age_restriction'
    ],
    clothing: [
      'brand', 'material', 'gender', 'age_group', 'sizes', 'colors',
      'care_instructions', 'made_in', 'is_secondhand', 'season'
    ],
    bookshop: [
      'isbn', 'author', 'publisher', 'publication_year', 'pages',
      'language', 'genre', 'cover_type', 'educational'
    ],
    retail: [
      'brand', 'model', 'color', 'dimensions_cm', 'weight_kg', 'condition',
      'features', 'warranty_months', 'warranty_provider'
    ]
  } as const;
  
  export type ShopType = keyof typeof ATTRIBUTE_SCHEMAS;