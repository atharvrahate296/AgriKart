require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function check() {
  console.log('Checking Supabase DB...');
  try {
    // 1. Fetch products
    const { data: products, error: pError } = await supabase.from('products').select('*').limit(1);
    if (pError) {
      console.error('Products error:', pError);
    } else {
      console.log('Products table exists. Sample product:', products);
    }

    // 2. Fetch users
    const { data: users, error: uError } = await supabase.from('users').select('*').limit(1);
    if (uError) {
      console.error('Users error:', uError);
    } else {
      console.log('Users table exists. Sample user:', users);
    }

    // 3. Fetch orders
    const { data: orders, error: oError } = await supabase.from('orders').select('*').limit(1);
    if (oError) {
      console.error('Orders error:', oError);
    } else {
      console.log('Orders table exists. Sample order:', orders);
    }

    // 4. Fetch vendors
    const { data: vendors, error: vError } = await supabase.from('vendors').select('*').limit(1);
    if (vError) {
      console.error('Vendors error:', vError);
    } else {
      console.log('Vendors table exists. Sample vendor:', vendors);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

check();
