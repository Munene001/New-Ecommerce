import { NextRequest, NextResponse } from 'next/server';

// GET /api/shopowner/products/attributes?shopType=pharmacy
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopType = searchParams.get('shopType');

  if (!shopType) {
    return NextResponse.json({ error: 'shopType required' }, { status: 400 });
  }

  const schemas = {
    pharmacy: {
      fields: [
        { name: 'manufacturer', type: 'text', label: 'Manufacturer', required: true },
        { name: 'dosage', type: 'text', label: 'Dosage', required: true },
        { name: 'form', type: 'text', label: 'Form (tablet, syrup, etc)', required: true },
        { name: 'requires_prescription', type: 'boolean', label: 'Requires Prescription', required: true },
        { name: 'expiry_date', type: 'date', label: 'Expiry Date', required: true },
        { name: 'storage_conditions', type: 'text', label: 'Storage Conditions', required: true },
        { name: 'ppb_registration_number', type: 'text', label: 'PPB Registration Number', required: true },
        { name: 'drug_class', type: 'text', label: 'Drug Class', required: true },
        { name: 'side_effects', type: 'text', label: 'Side Effects (comma separated)', required: false },
        { name: 'usage_instructions', type: 'textarea', label: 'Usage Instructions', required: true },
        { name: 'age_restriction', type: 'text', label: 'Age Restriction', required: false }
      ]
    },
    clothing: {
      fields: [
        { name: 'brand', type: 'text', label: 'Brand', required: true },
        { name: 'material', type: 'text', label: 'Material', required: true },
        { 
          name: 'gender', 
          type: 'select', 
          label: 'Gender', 
          options: ['men', 'women', 'unisex'],
          required: true 
        },
        { 
          name: 'age_group', 
          type: 'select', 
          label: 'Age Group', 
          options: ['adult', 'kids', 'infant'],
          required: true 
        },
        { name: 'sizes', type: 'text', label: 'Sizes (comma separated)', required: true },
        { name: 'colors', type: 'text', label: 'Colors (comma separated)', required: true },
        { name: 'care_instructions', type: 'textarea', label: 'Care Instructions', required: false },
        { name: 'made_in', type: 'text', label: 'Made In', required: false },
        { 
          name: 'is_secondhand', 
          type: 'boolean', 
          label: 'Is Secondhand', 
          required: true 
        },
        { 
          name: 'season', 
          type: 'select', 
          label: 'Season', 
          options: ['all-season', 'hot', 'cold'],
          required: false 
        }
      ]
    },
    bookshop: {
      fields: [
        { name: 'isbn', type: 'text', label: 'ISBN', required: true },
        { name: 'author', type: 'text', label: 'Author', required: true },
        { name: 'publisher', type: 'text', label: 'Publisher', required: true },
        { name: 'publication_year', type: 'number', label: 'Publication Year', required: true },
        { name: 'pages', type: 'number', label: 'Pages', required: false },
        { name: 'language', type: 'text', label: 'Language', required: false },
        { name: 'genre', type: 'text', label: 'Genre', required: false },
        { 
          name: 'cover_type', 
          type: 'select', 
          label: 'Cover Type', 
          options: ['softcover', 'hardcover', 'spiral', 'digital'],
          required: true 
        },
        { 
          name: 'educational', 
          type: 'boolean', 
          label: 'Educational', 
          required: true 
        }
      ]
    },
    retail: {
      fields: [
        { name: 'brand', type: 'text', label: 'Brand', required: true },
        { name: 'model', type: 'text', label: 'Model', required: true },
        { name: 'color', type: 'text', label: 'Color', required: false },
        { name: 'dimensions_cm', type: 'text', label: 'Dimensions (cm)', required: false },
        { name: 'weight_kg', type: 'number', label: 'Weight (kg)', required: false },
        { 
          name: 'condition', 
          type: 'select', 
          label: 'Condition', 
          options: ['new', 'refurbished', 'used'],
          required: true 
        },
        { name: 'features', type: 'text', label: 'Features (comma separated)', required: false },
        { name: 'warranty_months', type: 'number', label: 'Warranty (months)', required: false },
        { name: 'warranty_provider', type: 'text', label: 'Warranty Provider', required: false }
      ]
    }
  };

  const schema = schemas[shopType as keyof typeof schemas];
  
  if (!schema) {
    return NextResponse.json({ error: 'Invalid shop type' }, { status: 400 });
  }

  return NextResponse.json(schema);
}