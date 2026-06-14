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
    { key: 'klaviyo_api_key',             value: '' },
    { key: 'klaviyo_list_id',             value: '' },
    { key: 'klaviyo_company_id',          value: '' },
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

  // Seed default about/content
  const defaultContent = [
    { key: 'about_tagline',       value: 'Built in the 1800s along the banks of Fishing Creek, our building has been lovingly restored and decorated to honor its history. Come for the deals — stay for the experience.' },
    { key: 'about_hero_img',      value: '' },
    { key: 'about_img_interior',  value: '' },
    { key: 'about_img_millstone', value: '' },
    { key: 'about_img_decor',     value: '' },
    { key: 'about_card_1_title',  value: 'Historic Structure' },
    { key: 'about_card_1_body',   value: 'Original hand-hewn timber framing, stone foundation walls, and wide-plank floors dating back over 150 years.' },
    { key: 'about_card_2_title',  value: 'Working Mill Artifacts' },
    { key: 'about_card_2_body',   value: 'Antique millstones, gears, and equipment preserved throughout the building — history you can touch.' },
    { key: 'about_card_3_title',  value: 'Rustic Décor' },
    { key: 'about_card_3_body',   value: 'Reclaimed wood, vintage signage, and curated antiques create an atmosphere unlike any other gun shop.' },
    { key: 'about_card_4_title',  value: 'Find Us' },
    { key: 'about_card_4_body',   value: '1549 State Route 487, Orangeville PA 17859. Easy parking, right off the highway. Come say hello to Grant.' },
    { key: 'shop_hours',          value: 'Mon-Fri: 10am-6pm | Sat: 9am-5pm | Sun: 11am-4pm' },
  ];
  for (const c of defaultContent) {
    await prisma.content.upsert({
      where: { key: c.key },
      update: {},
      create: c,
    });
  }
  console.log('Seeded content');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
