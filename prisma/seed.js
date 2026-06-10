const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Seed default categories
  const defaultCategories = ['Rifles','Shotguns','Handguns','Optics','Ammunition','Accessories'];
  for (let i = 0; i < defaultCategories.length; i++) {
    await prisma.category.upsert({
      where: { name: defaultCategories[i] },
      update: {},
      create: { name: defaultCategories[i], sortOrder: i },
    });
  }
  console.log('Seeded categories');

  // Seed default settings
  const settings = [
    { key: 'firstpay_merchant_id',     value: '' },
    { key: 'firstpay_checkout_url',     value: '' },
    { key: 'admin_password',             value: '' },
    { key: 'cloudinary_cloud_name',    value: '' },
    { key: 'cloudinary_upload_preset', value: '' },
    { key: 'shop_name',                value: 'Gristmill Guns & Optics' },
    { key: 'shop_phone',               value: '(570) 713-7339' },
    { key: 'shop_email',               value: 'grant@gristmillguns.com' },
    { key: 'shop_address',             value: '1549 State Route 487, Orangeville PA 17859' },
    { key: 'shop_instagram',           value: 'gristmillguns' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('Seeded settings');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
