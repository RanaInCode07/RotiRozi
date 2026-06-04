/**
 * Prisma Seed Script
 * Run: pnpm --filter backend prisma:seed
 *
 * Creates a full demo restaurant with categories, menu items, and tables
 */

import { PrismaClient, Role, TenantPlan } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const HASH_ROUNDS = 10;

async function main() {
  console.log('🌱  Starting seed...\n');

  // ── Super Admin ────────────────────────────────────────────────────────────
  const superAdminTenant = await prisma.tenant.upsert({
    where: { id: 'seed-super-admin-tenant' },
    update: {},
    create: {
      id: 'seed-super-admin-tenant',
      name: 'SaaS Platform',
      plan: TenantPlan.ENTERPRISE,
    },
  });

  await prisma.user.upsert({
    where: { id: 'seed-super-admin-user' },
    update: {},
    create: {
      id: 'seed-super-admin-user',
      tenantId: superAdminTenant.id,
      email: 'superadmin@pos.dev',
      passwordHash: await bcrypt.hash('SuperAdmin@123', HASH_ROUNDS),
      name: 'Platform Admin',
      role: Role.SUPER_ADMIN,
    },
  });
  console.log('✅  Super Admin created: superadmin@pos.dev / SuperAdmin@123');

  // ── Demo Tenant ────────────────────────────────────────────────────────────
  const demoTenant = await prisma.tenant.upsert({
    where: { id: 'seed-demo-tenant' },
    update: {},
    create: {
      id: 'seed-demo-tenant',
      name: 'The Spice Garden',
      plan: TenantPlan.PROFESSIONAL,
    },
  });

  // ── Outlets ────────────────────────────────────────────────────────────────
  const outlet1 = await prisma.outlet.upsert({
    where: { id: 'seed-outlet-1' },
    update: {},
    create: {
      id: 'seed-outlet-1',
      tenantId: demoTenant.id,
      name: 'Koramangala Branch',
      address: '5th Block, Koramangala, Bengaluru',
      phone: '+919876543210',
      settings: { taxRate: 5, currency: 'INR', timezone: 'Asia/Kolkata' },
    },
  });

  await prisma.outlet.upsert({
    where: { id: 'seed-outlet-2' },
    update: {},
    create: {
      id: 'seed-outlet-2',
      tenantId: demoTenant.id,
      name: 'Indiranagar Branch',
      address: '100 Feet Road, Indiranagar, Bengaluru',
      phone: '+919876543211',
      settings: { taxRate: 5, currency: 'INR', timezone: 'Asia/Kolkata' },
    },
  });
  console.log('✅  Demo tenant + 2 outlets created');

  // ── Users ──────────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { id: 'seed-tenant-owner' },
    update: {},
    create: {
      id: 'seed-tenant-owner',
      tenantId: demoTenant.id,
      email: 'owner@spicegarden.dev',
      passwordHash: await bcrypt.hash('Owner@1234', HASH_ROUNDS),
      name: 'Rajesh Kumar',
      role: Role.TENANT_OWNER,
    },
  });

  await prisma.user.upsert({
    where: { id: 'seed-outlet-manager' },
    update: {},
    create: {
      id: 'seed-outlet-manager',
      tenantId: demoTenant.id,
      outletId: outlet1.id,
      email: 'manager@spicegarden.dev',
      passwordHash: await bcrypt.hash('Manager@1234', HASH_ROUNDS),
      name: 'Sunita Patel',
      role: Role.OUTLET_MANAGER,
    },
  });

  await prisma.user.upsert({
    where: { id: 'seed-billing-clerk' },
    update: {},
    create: {
      id: 'seed-billing-clerk',
      tenantId: demoTenant.id,
      outletId: outlet1.id,
      email: 'cashier@spicegarden.dev',
      passwordHash: await bcrypt.hash('Cashier@1234', HASH_ROUNDS),
      name: 'Priya Sharma',
      role: Role.BILLING_CLERK,
    },
  });

  await prisma.user.upsert({
    where: { id: 'seed-kitchen-staff' },
    update: {},
    create: {
      id: 'seed-kitchen-staff',
      tenantId: demoTenant.id,
      outletId: outlet1.id,
      email: 'kitchen@spicegarden.dev',
      passwordHash: await bcrypt.hash('Kitchen@1234', HASH_ROUNDS),
      name: 'Arjun Singh',
      role: Role.KITCHEN_STAFF,
    },
  });

  console.log('✅  Demo users created');

  // ── Categories ─────────────────────────────────────────────────────────────
  const categories = [
    { id: 'seed-cat-starters', name: 'Starters', sortOrder: 1 },
    { id: 'seed-cat-mains', name: 'Main Course', sortOrder: 2 },
    { id: 'seed-cat-breads', name: 'Breads', sortOrder: 3 },
    { id: 'seed-cat-rice', name: 'Rice & Biryani', sortOrder: 4 },
    { id: 'seed-cat-beverages', name: 'Beverages', sortOrder: 5 },
    { id: 'seed-cat-desserts', name: 'Desserts', sortOrder: 6 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: {
        id: cat.id,
        tenantId: demoTenant.id,
        outletId: outlet1.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
      },
    });
  }
  console.log('✅  6 categories created');

  // ── Menu Items ─────────────────────────────────────────────────────────────
  const menuItems = [
    { id: 'seed-mi-1', categoryId: 'seed-cat-starters', name: 'Paneer Tikka', shortcode: 'PT1', price: 249, isVeg: true, preparationTime: 15 },
    { id: 'seed-mi-2', categoryId: 'seed-cat-starters', name: 'Chicken 65', shortcode: 'CK65', price: 299, isVeg: false, preparationTime: 12 },
    { id: 'seed-mi-3', categoryId: 'seed-cat-starters', name: 'Veg Spring Roll', shortcode: 'VSR', price: 179, isVeg: true, preparationTime: 10 },
    { id: 'seed-mi-4', categoryId: 'seed-cat-starters', name: 'Fish Fry', shortcode: 'FF1', price: 349, isVeg: false, preparationTime: 15 },
    { id: 'seed-mi-5', categoryId: 'seed-cat-mains', name: 'Butter Chicken', shortcode: 'BC1', price: 359, isVeg: false, preparationTime: 20 },
    { id: 'seed-mi-6', categoryId: 'seed-cat-mains', name: 'Paneer Butter Masala', shortcode: 'PBM', price: 299, isVeg: true, preparationTime: 18 },
    { id: 'seed-mi-7', categoryId: 'seed-cat-mains', name: 'Dal Makhani', shortcode: 'DM1', price: 249, isVeg: true, preparationTime: 25 },
    { id: 'seed-mi-8', categoryId: 'seed-cat-mains', name: 'Mutton Rogan Josh', shortcode: 'MRJ', price: 449, isVeg: false, preparationTime: 25 },
    { id: 'seed-mi-9', categoryId: 'seed-cat-mains', name: 'Kadhai Paneer', shortcode: 'KP1', price: 279, isVeg: true, preparationTime: 15 },
    { id: 'seed-mi-10', categoryId: 'seed-cat-breads', name: 'Butter Naan', shortcode: 'BN1', price: 59, isVeg: true, preparationTime: 5 },
    { id: 'seed-mi-11', categoryId: 'seed-cat-breads', name: 'Garlic Naan', shortcode: 'GN1', price: 69, isVeg: true, preparationTime: 5 },
    { id: 'seed-mi-12', categoryId: 'seed-cat-breads', name: 'Tandoori Roti', shortcode: 'TR1', price: 39, isVeg: true, preparationTime: 4 },
    { id: 'seed-mi-13', categoryId: 'seed-cat-rice', name: 'Chicken Biryani', shortcode: 'CB1', price: 329, isVeg: false, preparationTime: 25 },
    { id: 'seed-mi-14', categoryId: 'seed-cat-rice', name: 'Veg Biryani', shortcode: 'VB1', price: 249, isVeg: true, preparationTime: 22 },
    { id: 'seed-mi-15', categoryId: 'seed-cat-rice', name: 'Jeera Rice', shortcode: 'JR1', price: 149, isVeg: true, preparationTime: 10 },
    { id: 'seed-mi-16', categoryId: 'seed-cat-beverages', name: 'Masala Chai', shortcode: 'MC1', price: 49, isVeg: true, preparationTime: 5 },
    { id: 'seed-mi-17', categoryId: 'seed-cat-beverages', name: 'Cold Coffee', shortcode: 'CC1', price: 129, isVeg: true, preparationTime: 5 },
    { id: 'seed-mi-18', categoryId: 'seed-cat-beverages', name: 'Fresh Lime Soda', shortcode: 'FLS', price: 79, isVeg: true, preparationTime: 3 },
    { id: 'seed-mi-19', categoryId: 'seed-cat-desserts', name: 'Gulab Jamun', shortcode: 'GJ1', price: 99, isVeg: true, preparationTime: 2 },
    { id: 'seed-mi-20', categoryId: 'seed-cat-desserts', name: 'Rasmalai', shortcode: 'RM1', price: 129, isVeg: true, preparationTime: 2 },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        tenantId: demoTenant.id,
        outletId: outlet1.id,
        categoryId: item.categoryId,
        name: item.name,
        shortcode: item.shortcode,
        price: item.price,
        isVeg: item.isVeg,
        preparationTime: item.preparationTime,
      },
    });
  }
  console.log('✅  20 menu items created');

  // ── Tables ─────────────────────────────────────────────────────────────────
  const tables = [
    { id: 'seed-table-1', name: 'T1', capacity: 2, floor: 'Ground Floor' },
    { id: 'seed-table-2', name: 'T2', capacity: 2, floor: 'Ground Floor' },
    { id: 'seed-table-3', name: 'T3', capacity: 4, floor: 'Ground Floor' },
    { id: 'seed-table-4', name: 'T4', capacity: 4, floor: 'Ground Floor' },
    { id: 'seed-table-5', name: 'T5', capacity: 6, floor: 'Ground Floor' },
    { id: 'seed-table-6', name: 'T6', capacity: 6, floor: 'Ground Floor' },
    { id: 'seed-table-7', name: 'R1', capacity: 4, floor: 'Rooftop' },
    { id: 'seed-table-8', name: 'R2', capacity: 4, floor: 'Rooftop' },
    { id: 'seed-table-9', name: 'R3', capacity: 8, floor: 'Rooftop' },
    { id: 'seed-table-10', name: 'P1', capacity: 10, floor: 'Private Dining' },
  ];

  for (const table of tables) {
    await prisma.restaurantTable.upsert({
      where: { id: table.id },
      update: {},
      create: {
        id: table.id,
        outletId: outlet1.id,
        name: table.name,
        capacity: table.capacity,
        floor: table.floor,
      },
    });
  }
  console.log('✅  10 tables created');

  console.log('\n──────────────────────────────────────────────────────────');
  console.log('🎉  Seed complete! Login credentials:');
  console.log('──────────────────────────────────────────────────────────');
  console.log('  Tenant Owner:   owner@spicegarden.dev  / Owner@1234');
  console.log('  Outlet Manager: manager@spicegarden.dev / Manager@1234');
  console.log('  Billing Clerk:  cashier@spicegarden.dev / Cashier@1234');
  console.log('  Kitchen Staff:  kitchen@spicegarden.dev / Kitchen@1234');
  console.log('──────────────────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
