import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopType = searchParams.get('shopType');

  if (!shopType) {
    return NextResponse.json({ error: 'shopType required' }, { status: 400 });
  }

  const schemas = {
    pharmacy: {
      fields: [
        // PRODUCT-LEVEL (variant: false)
        { name: 'manufacturer', type: 'text', label: 'Manufacturer', required: true, variant: false },
        { name: 'requires_prescription', type: 'boolean', label: 'Requires Prescription', required: true, variant: false },
        { name: 'expiry_date', type: 'date', label: 'Expiry Date', required: true, variant: false },
        { name: 'storage_conditions', type: 'text', label: 'Storage Conditions', required: true, variant: false },
        { name: 'ppb_registration_number', type: 'text', label: 'PPB Registration Number', required: true, variant: false },
        { name: 'drug_class', type: 'text', label: 'Drug Class', required: true, variant: false },
        { name: 'side_effects', type: 'text', label: 'Side Effects (comma separated)', required: false, variant: false },
        { name: 'usage_instructions', type: 'textarea', label: 'Usage Instructions', required: true, variant: false },
        { name: 'age_restriction', type: 'text', label: 'Age Restriction', required: false, variant: false },
        
        // VARIANT-LEVEL (variant: true) - ONLY dosage
        { name: 'dosage', type: 'text', label: 'Dosage', required: true, variant: true }
      ]
    },
    
    clothing: {
      fields: [
        // PRODUCT-LEVEL (variant: false)
        { name: 'brand', type: 'text', label: 'Brand', required: true, variant: false },
        { name: 'material', type: 'text', label: 'Material', required: true, variant: false },
        { name: 'gender', type: 'select', label: 'Gender', options: ['men', 'women', 'unisex'], required: true, variant: false },
        { name: 'age_group', type: 'select', label: 'Age Group', options: ['adult', 'kids', 'infant'], required: true, variant: false },
        { name: 'care_instructions', type: 'textarea', label: 'Care Instructions', required: false, variant: false },
        { name: 'made_in', type: 'text', label: 'Made In', required: false, variant: false },
        { name: 'is_secondhand', type: 'boolean', label: 'Is Secondhand', required: true, variant: false },
        { name: 'season', type: 'select', label: 'Season', options: ['all-season', 'hot', 'cold'], required: false, variant: false },
        
        // VARIANT-LEVEL (variant: true) - sizes AND colors
        { name: 'sizes', type: 'text', label: 'Sizes (comma separated)', required: true, variant: true },
        { name: 'colors', type: 'text', label: 'Colors (comma separated)', required: true, variant: true }
      ]
    },
    
    bookshop: {
      fields: [
        // PRODUCT-LEVEL (variant: false)
        { name: 'isbn', type: 'text', label: 'ISBN', required: true, variant: false },
        { name: 'author', type: 'text', label: 'Author', required: true, variant: false },
        { name: 'publisher', type: 'text', label: 'Publisher', required: true, variant: false },
        { name: 'publication_year', type: 'number', label: 'Publication Year', required: true, variant: false },
        { name: 'pages', type: 'number', label: 'Pages', required: false, variant: false },
        { name: 'language', type: 'text', label: 'Language', required: false, variant: false },
        { name: 'genre', type: 'text', label: 'Genre', required: false, variant: false },
        { name: 'educational', type: 'boolean', label: 'Educational', required: true, variant: false },
        
        // VARIANT-LEVEL (variant: true) - cover_type
        { name: 'cover_type', type: 'select', label: 'Cover Type', options: ['softcover', 'hardcover', 'spiral', 'digital'], required: true, variant: true }
      ]
    },
    
    retail: {
      fields: [
        // PRODUCT-LEVEL (variant: false)
        { name: 'brand', type: 'text', label: 'Brand/Manufacturer', required: true, variant: false },
        { name: 'model', type: 'text', label: 'Model/Type', required: true, variant: false },
        { name: 'dimensions_cm', type: 'text', label: 'Dimensions', required: false, variant: false },
        { name: 'weight_volume', type: 'text', label: 'Weight/Volume', required: false, variant: false },
        { name: 'condition', type: 'select', label: 'Condition', options: ['new', 'refurbished', 'used'], required: true, variant: false },
        { name: 'features', type: 'text', label: 'Features (comma separated)', required: false, variant: false },
        { name: 'warranty_months', type: 'number', label: 'Warranty (months)', required: false, variant: false },
        { name: 'warranty_provider', type: 'text', label: 'Warranty Provider', required: false, variant: false },
        
        // VARIANT-LEVEL (variant: true) - size AND color
        { name: 'size', type: 'text', label: 'Size', required: false, variant: true },
        { name: 'color', type: 'text', label: 'Color', required: false, variant: true }
      ]
    }
  };

  const schema = schemas[shopType as keyof typeof schemas];
  if (!schema) {
    return NextResponse.json({ error: 'Invalid shop type' }, { status: 400 });
  }

  return NextResponse.json(schema);
}