
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // These come from your tenant table enum
    const shopTypes = [
      { value: 'retail', label: 'Retail Store' },
      { value: 'clothing', label: 'Clothing & Fashion' },
      { value: 'pharmacy', label: 'Pharmacy' },
      { value: 'bookshop', label: 'Bookshop' }
    ];

    return NextResponse.json({ 
      success: true, 
      shopTypes 
    });
    
  } catch (error) {
    console.error('Error fetching shop types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shop types' },
      { status: 500 }
    );
  }
}