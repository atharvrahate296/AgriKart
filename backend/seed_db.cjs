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
        role: 'farmer'
      },
      {
        email: 'vendor1@example.com',
        password: 'password123',
        fullName: 'Greenfield Agri Solutions',
        phone: '9876543211',
        role: 'vendor',
        companyName: 'Greenfield Agri Solutions Ltd',
        location: 'Punjab, India',
        description: 'Leading provider of high-yield crop seeds and modern tools.'
      },
      {
        email: 'vendor2@example.com',
        password: 'password123',
        fullName: 'Bharat Seeds & Fertilizers',
        phone: '9876543212',
        role: 'vendor',
        companyName: 'Bharat Seeds & Fertilizers Co.',
        location: 'Maharashtra, India',
        description: 'Supplier of premium organic fertilizers and pesticide solutions.'
      }
    ];

    const seededUsers = [];

    // Get list of existing users to avoid duplicates
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
        verified: true
      });

      if (userError) {
        console.error(`Error inserting user ${u.email}:`, userError);
      }
    }

    // 3. Insert into public.vendors
    console.log('Inserting into public.vendors...');
    const vendors = seededUsers.filter(u => u.role === 'vendor');
    for (const v of vendors) {
      const { error: vendorError } = await supabase.from('vendors').upsert({
        id: v.id,
        company_name: v.companyName,
        location: v.location,
        phone_business: v.phone,
        rating: 4.8,
        reviews_count: 24,
        verified_badge: true,
        description: v.description
      });

      if (vendorError) {
        console.error(`Error inserting vendor profile ${v.companyName}:`, vendorError);
      }
    }

    // 4. Insert into public.products
    console.log('Inserting into public.products...');
    const productsData = [
      {
        vendor_id: vendors[0].id,
        name: 'Premium Wheat Seeds (HD 2967)',
        description: 'High yielding variety of wheat seeds, resistant to rust and leaf blight. Ideal for northern Indian plains.',
        category: 'Seeds',
        price: 450.00,
        original_price: 500.00,
        stock_quantity: 120,
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500',
        additional_images: JSON.stringify(['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500']),
        specifications: JSON.stringify({ Weight: '10kg', 'Germination Rate': '92%', Variety: 'HD 2967' }),
        rating: 4.8
      },
      {
        vendor_id: vendors[0].id,
        name: 'Hybrid Maize Seeds',
        description: 'Double cross hybrid maize seeds offering excellent grain quality and high yields under varying rain conditions.',
        category: 'Seeds',
        price: 380.00,
        original_price: 450.00,
        stock_quantity: 80,
        image: 'https://images.unsplash.com/photo-1551754625-7fc5b945d5fd?w=500',
        additional_images: JSON.stringify([]),
        specifications: JSON.stringify({ Weight: '5kg', 'Germination Rate': '90%', 'Maturity Period': '100 days' }),
        rating: 4.5
      },
      {
        vendor_id: vendors[1].id,
        name: 'Organic NPK Compost Fertilizer',
        description: 'Rich in organic Nitrogen, Phosphorus, and Potassium. Improves soil aeration, water retention, and microbial activity.',
        category: 'Fertilizers',
        price: 280.00,
        original_price: 350.00,
        stock_quantity: 200,
        image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500',
        additional_images: JSON.stringify([]),
        specifications: JSON.stringify({ Weight: '25kg', Type: 'Organic', Form: 'Granular' }),
        rating: 4.7
      },
      {
        vendor_id: vendors[1].id,
        name: 'Neem Oil Pest Repellent',
        description: 'Pure cold-pressed neem oil concentrate. Serves as an effective organic pesticide, fungicide, and miticide.',
        category: 'Pesticides',
        price: 190.00,
        original_price: 240.00,
        stock_quantity: 60,
        image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500',
        additional_images: JSON.stringify([]),
        specifications: JSON.stringify({ Volume: '1 Litre', Concentration: '100%', Dilution: '5ml per Litre' }),
        rating: 4.6
      },
      {
        vendor_id: vendors[0].id,
        name: 'Stainless Steel Hand Trowel',
        description: 'Ergonomic handle hand trowel for weeding, transplanting, and soil mixing on small farms or gardens.',
        category: 'Tools',
        price: 340.00,
        original_price: 400.00,
        stock_quantity: 45,
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500',
        additional_images: JSON.stringify([]),
        specifications: JSON.stringify({ Material: 'Stainless Steel', Length: '12 inches', Weight: '250g' }),
        rating: 4.4
      },
      {
        vendor_id: vendors[1].id,
        name: 'Premium Drip Irrigation Kit',
        description: 'Complete kit to irrigate up to 100 plants. Includes drippers, main supply line, elbow connectors, and filters.',
        category: 'Irrigation',
        price: 2499.00,
        original_price: 2999.00,
        stock_quantity: 15,
        image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500',
        additional_images: JSON.stringify([]),
        specifications: JSON.stringify({ Coverage: '100 plants', 'Line Length': '50m', 'Water Pressure': '1-2 bar' }),
        rating: 4.9
      }
    ];

    // Clean up existing products to prevent duplicates during testing
    const { data: existingProducts } = await supabase.from('products').select('id, name');
    for (const prod of productsData) {
      const exist = existingProducts?.find(ep => ep.name === prod.name);
      const insertData = { ...prod };
      if (exist) {
        insertData.id = exist.id;
      }
      const { data: insertedProducts, error: prodError } = await supabase.from('products').upsert(insertData).select();
      if (prodError) {
        console.error(`Error inserting product ${prod.name}:`, prodError);
      } else if (insertedProducts && insertedProducts[0]) {
        // Insert a mock review for the product
        console.log(`Inserting review for: ${prod.name}`);
        await supabase.from('reviews').upsert({
          product_id: insertedProducts[0].id,
          user_name: 'Harish Patel',
          rating: Math.floor(prod.rating),
          comment: `Great product! Used it for my last harvest and the results were excellent. Fully recommend it.`,
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
