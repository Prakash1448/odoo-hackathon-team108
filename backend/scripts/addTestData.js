import { initializeDatabase, run, get } from '../database.js';
import { hashPassword } from '../auth.js';
import { v4 as uuidv4 } from 'uuid';

async function addTestData() {
  try {
    await initializeDatabase();

    // Create test customer
    const customerId = uuidv4();
    const passwordHash = await hashPassword('TestPassword123');

    await run(
      `INSERT INTO customers (id, full_name, company_name, email, phone_number, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customerId, 'Rajesh Kumar', 'ABC Technologies Pvt Ltd', 'rajesh@abctech.com', '+919876543210', passwordHash]
    );

    console.log('✓ Test customer created');
    console.log('  Email: rajesh@abctech.com');
    console.log('  Password: TestPassword123');

    // Create test sales request
    const requestId = 'REQ-001';
    await run(
      `INSERT INTO sales_requests 
       (id, customer_id, request_title, product_requirement, quantity, specifications, additional_notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        customerId,
        '90 Business Laptops for Q4 Expansion',
        'Business Laptop',
        90,
        '16GB RAM, 512GB SSD, Intel i7 or equivalent, Windows 11 Pro',
        'Need installation and 1-year technical support',
        'Under Review'
      ]
    );

    console.log('✓ Test sales request created');
    console.log('  Request ID: REQ-001');

    // Create test quotation
    const quotationId = uuidv4();
    await run(
      `INSERT INTO quotations 
       (id, request_id, customer_id, quotation_status, notes, valid_until)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        quotationId,
        requestId,
        customerId,
        'Awaiting Customer Response',
        'Payment terms: 30 days. Delivery: 2 weeks after order confirmation. Includes 1-year warranty.',
        '2026-09-20'
      ]
    );

    console.log('✓ Test quotation created');
    console.log('  Quotation ID: ' + quotationId);

    // Create quotation line items
    const lineItemId = uuidv4();
    await run(
      `INSERT INTO quotation_line_items 
       (id, quotation_id, product_name, quantity, unit_price, subtotal, discount_percent, discount_amount, tax_amount, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lineItemId,
        quotationId,
        'Business Laptop',
        90,
        50000,
        4500000,
        10,
        450000,
        0,
        4050000
      ]
    );

    console.log('✓ Test quotation line item created');
    console.log('  90 × Business Laptop @ ₹50,000 each');
    console.log('  Subtotal: ₹45,00,000');
    console.log('  Discount (10%): -₹4,50,000');
    console.log('  Total: ₹40,50,000');

    console.log('\n✅ Test data added successfully!');
    console.log('\nYou can now login and test the customer flow:');
    console.log('1. Go to http://localhost:5173');
    console.log('2. Click "Login"');
    console.log('3. Email: rajesh@abctech.com');
    console.log('4. Password: TestPassword123');

    process.exit(0);
  } catch (error) {
    console.error('Error adding test data:', error);
    process.exit(1);
  }
}

addTestData();
