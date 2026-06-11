require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create Test Users in Auth
    console.log('Creating auth users...');
    const testUsers = [
      {
        email: 'farmer@example.com',
        password: 'password123',
        fullName: 'Ramesh Kumar',
        phone: '9876543210',
        role: 'farmer',
        location: 'Chandigarh',
        state: 'Punjab',
        bio: 'Dedicated farmer looking for modern farming solutions.'
      },
      {
        email: 'vendor1@example.com',
        password: 'password123',
        fullName: 'Greenfield Agri Solutions',
        phone: '9876543211',
        role: 'vendor',
        companyName: 'Greenfield Agri Solutions Ltd',
        location: 'Ludhiana',
        state: 'Punjab',
        description: 'Leading provider of high-yield crop seeds and modern tools.',
        bio: 'Experts in agricultural supplies.'
      },
      {
        email: 'vendor2@example.com',
        password: 'password123',
        fullName: 'Bharat Seeds & Fertilizers',
        phone: '9876543212',
        role: 'vendor',
        companyName: 'Bharat Seeds & Fertilizers Co.',
        location: 'Nagpur',
        state: 'Maharashtra',
        description: 'Supplier of premium organic fertilizers and pesticide solutions.',
        bio: 'Your trusted partner for organic farming.'
      }
    ];

    const seededUsers = [];

    const { data: { users: existingAuthUsers }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing auth users:', listError);
      throw listError;
    }

    for (const u of testUsers) {
      let authUser = existingAuthUsers.find(exist => exist.email === u.email);

      if (!authUser) {
        console.log(`Creating auth user: ${u.email}`);
        const { data, error } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true
        });

        if (error) {
          console.error(`Failed to create auth user ${u.email}:`, error);
          continue;
        }
        authUser = data.user;
      } else {
        console.log(`Auth user already exists: ${u.email}`);
      }

      seededUsers.push({
        ...u,
        id: authUser.id
      });
    }

    // 2. Insert into public.users and public.profiles
    console.log('Inserting into public.users and profiles...');
    for (const u of seededUsers) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: u.id,
        email: u.email,
        full_name: u.fullName,
        phone: u.phone,
        role: u.role,
        location: u.location,
        state: u.state,
        bio: u.bio,
        verification_status: 'approved',
        email_verified: true,
        phone_verified: true
      });

      if (profileError) {
        console.error(`Error inserting profile ${u.email}:`, profileError);
      }

      const { error: userError } = await supabase.from('users').upsert({
        id: u.id,
        email: u.email,
        full_name: u.fullName,
        phone: u.phone,
        role: u.role,
        verified: true,
        location: u.location,
        bio: u.bio
      });

      if (userError) {
        console.error(`Error inserting user ${u.email}:`, userError);
      }
    }

    // 3. Insert into public.vendors
    console.log('Inserting into public.vendors...');
    const vendors = seededUsers.filter(u => u.role === 'vendor');
    for (const v of vendors) {
      const vendorData = {
        id: v.id,
        user_id: v.id,
        company_name: v.companyName,
        business_name: v.companyName,
        business_address: v.location,
        city: v.location,
        state: v.state,
        business_phone: v.phone,
        business_email: v.email,
        business_description: v.description,
        rating: 4.8,
        average_rating: 4.8,
        reviews_count: 24,
        total_reviews: 24,
        is_verified: true,
        is_active: true
      };
      
      const { error: vendorError } = await supabase.from('vendors').upsert(vendorData);

      if (vendorError) {
        console.error(`Error inserting vendor profile ${v.companyName}:`, vendorError);
      } else {
        console.log(`Successfully inserted vendor: ${v.companyName}`);
      }
    }

    // 4. Ensure Categories
    console.log('Ensuring categories exist...');
    const categories = [
      { name: 'Seeds', slug: 'seeds' },
      { name: 'Fertilizers', slug: 'fertilizers' },
      { name: 'Pesticides', slug: 'pesticides' },
      { name: 'Tools', slug: 'tools' },
      { name: 'Irrigation', slug: 'irrigation' }
    ];
    
    for (const cat of categories) {
      await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
    }
    
    const { data: catData } = await supabase.from('categories').select('id, name');

    // 5. Insert into public.products
    console.log('Inserting 10 products into public.products...');
    const productsData = [
      { name: 'Wheat Seeds', cat: 'Seeds', price: 450, stock: 100 },
      { name: 'Maize Seeds', cat: 'Seeds', price: 380, stock: 80 },
      { name: 'NPK Fertilizer', cat: 'Fertilizers', price: 280, stock: 200 },
      { name: 'Urea Fertilizer', cat: 'Fertilizers', price: 300, stock: 150 },
      { name: 'Neem Oil', cat: 'Pesticides', price: 190, stock: 60 },
      { name: 'Fungicide Spray', cat: 'Pesticides', price: 250, stock: 40 },
      { name: 'Hand Trowel', cat: 'Tools', price: 340, stock: 45 },
      { name: 'Garden Shears', cat: 'Tools', price: 400, stock: 30 },
      { name: 'Drip Kit', cat: 'Irrigation', price: 2499, stock: 15 },
      { name: 'Sprinkler System', cat: 'Irrigation', price: 1500, stock: 20 },
    ].map((p, i) => {
      const imageUrl = `https://images.unsplash.com/photo-${i + 1000000000}?w=500`;
      return {
        vendor_id: vendors[i % vendors.length].id,
        name: p.name,
        description: `Premium ${p.name} for high-quality farming.`,
        category: p.cat,
        category_id: catData.find(c => c.name === p.cat)?.id,
        price: p.price,
        original_price: p.price + 50,
        stock_quantity: p.stock,
        quantity_in_stock: p.stock,
        image_url: imageUrl,
        image: imageUrl, // Populating both legacy and new column
        sku: `SKU-${p.name.substring(0, 3).toUpperCase()}-${i}`,
        tags: ['organic', 'high-yield'],
        specifications: { weight: '1kg' },
        rating: 4.5,
        average_rating: 4.5,
        is_active: true
      };
    });

    for (const prod of productsData) {
      const { data: insertedProducts, error: prodError } = await supabase.from('products').upsert(prod).select();
      if (prodError) {
        console.error(`Error inserting product ${prod.name}:`, prodError);
      } else if (insertedProducts && insertedProducts[0]) {
        await supabase.from('reviews').upsert({
          product_id: insertedProducts[0].id,
          user_name: 'Harish Patel',
          rating: 5,
          comment: `Amazing quality!`,
          created_at: new Date()
        });
      }
    }

    console.log('🎉 Database seeding complete successfully!');
  } catch (err) {
    console.error('Fatal error during seeding:', err);
  }
}

seed();
