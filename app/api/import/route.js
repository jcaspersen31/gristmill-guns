export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

function mapCategory(category, subCategory) {
  const sub = (subCategory || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  if (sub.includes('rifle')) return 'Rifles';
  if (sub.includes('shotgun')) return 'Shotguns';
  if (sub.includes('pistol') || sub.includes('handgun') || sub.includes('revolver')) return 'Handguns';
  if (cat.includes('handgun') || cat.includes('pistol')) return 'Handguns';
  if (cat.includes('shotgun')) return 'Shotguns';
  if (cat.includes('rifle') || cat.includes('long gun')) return 'Rifles';
  if (cat.includes('ammo') || cat.includes('ammunition')) return 'Ammunition';
  if (cat.includes('optic') || cat.includes('scope')) return 'Optics';
  if (cat.includes('accessory') || cat.includes('accessories')) return 'Accessories';
  return subCategory || category || 'Accessories';
}

function parsePrice(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : Math.round(n);
}

function parseQty(val) {
  if (val === null || val === undefined || val === '') return null;
  // Orchid exports qty as "1.0000" — parse as float then round
  const n = parseFloat(String(val));
  return isNaN(n) ? null : Math.round(n);
}

function parseDate(val) {
  if (!val) return null;
  try {
    // XLSX may return a date serial number
    if (typeof val === 'number') {
      const d = XLSX.SSF.parse_date_code(val);
      return new Date(d.y, d.m - 1, d.d);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

function parseRows(buffer, fileType) {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: false,
    raw: false,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows.filter(r => r['Description'] || r['Part Number'] || r['UPC']);
}

function buildProductData(row) {
  const retailPrice = parsePrice(row['Retail Price']);
  if (!retailPrice) return null;
  const name = String(row['Description'] || '').trim();
  if (!name) return null;

  const onSale = String(row['On Sale'] || '').toLowerCase() === 'yes';
  const discountValue = parseFloat(row['Discount Value (%)'] || '0') || 0;
  const salePrice = onSale && discountValue > 0
    ? Math.round(retailPrice * (1 - discountValue / 100))
    : null;

  return {
    name,
    category:         mapCategory(row['Category'], row['Sub Category']),
    price:            retailPrice,
    salePrice,
    msrp:             parsePrice(row['MSRP']),
    onSale,
    discountValue:    discountValue || null,
    upc:              String(row['UPC'] || '').trim() || null,
    manufacturer:     String(row['Manufacturer'] || '').trim() || null,
    model:            String(row['Model'] || '').trim() || null,
    partNumber:       String(row['Part Number'] || '').trim() || null,
    sku:              String(row['Part Number'] || '').trim() || null,
    caliber:          String(row['Firearm Caliber / GA'] || '').trim() || null,
    atfType:          String(row['ATF Type'] || '').trim() || null,
    cartridge:        String(row['Catridge'] || '').trim() || null,
    action:           String(row['Action'] || '').trim() || null,
    barrelLength:     String(row['Barrel Length'] || '').trim() || null,
    overallLength:    String(row['Overall Length'] || '').trim() || null,
    magazineCapacity: String(row['Magazine Capacity'] || '').trim() || null,
    magazineType:     String(row['Magazine Type'] || '').trim() || null,
    condition:        String(row['Firearm Condition'] || '').trim() || null,
    quantityOnHand:   parseQty(row['Quantity on Hand']),
    reorderLevel:     parseQty(row['Reorder Level']),
    lastReceivedDate: parseDate(row['Last Received Date']),
    description:      [row['Manufacturer'], row['Model']].filter(Boolean).join(' ') || null,
  };
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const preview = formData.get('preview') === 'true';
    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseRows(buffer, file.name);

    if (preview) {
      const previewData = rows.slice(0, 10).map(row => buildProductData(row)).filter(Boolean);
      return NextResponse.json({ rows: previewData, total: rows.length });
    }

    const results = { created: 0, updated: 0, skipped: 0, errors: [] };

    // Auto-create any missing categories before import
    const uniqueCats = [...new Set(rows.map(r => mapCategory(r['Category'], r['Sub Category'])).filter(Boolean))];
    for (const catName of uniqueCats) {
      const exists = await prisma.category.findFirst({ where: { name: catName } });
      if (!exists) {
        const count = await prisma.category.count();
        await prisma.category.create({ data: { name: catName, sortOrder: count } });
      }
    }

    for (const row of rows) {
      try {
        const data = buildProductData(row);
        if (!data) { results.skipped++; continue; }

        const upc = String(row['UPC'] || '').trim();
        const partNum = String(row['Part Number'] || '').trim();

        // Search including inactive so re-importing deleted products reactivates them
        const existing = upc
          ? await prisma.product.findFirst({ where: { upc } })
          : partNum
          ? await prisma.product.findFirst({ where: { partNumber: partNum } })
          : null;

        if (existing) {
          await prisma.product.update({ where: { id: existing.id }, data: { ...data, active: true } });
          results.updated++;
        } else {
          await prisma.product.create({ data: { ...data, active: true } });
          results.created++;
        }
      } catch (e) {
        results.errors.push({ row: String(row['Description'] || row['Part Number'] || ''), error: e.message });
      }
    }

    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
