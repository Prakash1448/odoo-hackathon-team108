import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test results tracking
const results = {
  steps: [],
  passed: 0,
  failed: 0,
  testData: {}
};

function logStep(stepNum, title, status, details = '') {
  const message = `[STEP ${stepNum}] ${title} - ${status}`;
  console.log(message);
  if (details) console.log(`  Details: ${details}`);
  
  results.steps.push({ stepNum, title, status, details });
  if (status === '✓ PASS') results.passed++;
  else results.failed++;
}

async function testEndToEnd() {
  console.log('🚀 DealFlow360 Module 1 - End-to-End Workflow Test');
  console.log('=' .repeat(70));
  
  try {
    // STEP 1: Customer Registration
    console.log('\n📝 CUSTOMER REGISTRATION');
    let customerData = {
      fullName: 'ABC Technologies Manager',
      companyName: 'ABC Technologies Pvt Ltd',
      email: 'manager@abctech.com',
      phone: '9876543210',
      password: 'Test@1234'
    };
    
    let response = await axios.post(`${BASE_URL}/auth/register`, customerData);
    if (response.status === 201 && response.data.token) {
      logStep(1, 'Customer Registration', '✓ PASS', `Email: ${customerData.email}`);
      results.testData.customerToken = response.data.token;
      results.testData.customerId = response.data.userId;
    } else {
      logStep(1, 'Customer Registration', '✗ FAIL', response.data.error);
      throw new Error('Customer registration failed');
    }
    
    // STEP 2: Customer Creates Sales Query
    console.log('\n🔍 CUSTOMER CREATES QUERY');
    let requestData = {
      title: 'Need 90 Business Laptops',
      product: 'Business Laptop',
      quantity: 90,
      specifications: '16GB RAM, 512GB SSD, Intel i7 or equivalent',
      additionalNotes: 'Need installation and 1-year support',
      expectedDelivery: '30 days'
    };
    
    response = await axios.post(
      `${BASE_URL}/customer/requests`,
      requestData,
      { headers: { Authorization: `Bearer ${results.testData.customerToken}` } }
    );
    
    if (response.status === 201 && response.data.requestId) {
      logStep(2, 'Create Sales Query', '✓ PASS', `Request ID: ${response.data.requestId}`);
      results.testData.requestId = response.data.requestId;
    } else {
      logStep(2, 'Create Sales Query', '✗ FAIL', response.data.error);
      throw new Error('Request creation failed');
    }
    
    // STEP 3: Salesperson Registration
    console.log('\n👤 SALESPERSON REGISTRATION');
    let salespersonData = {
      fullName: 'John Smith',
      email: 'john.smith@company.com',
      password: 'Salesperson@123'
    };
    
    response = await axios.post(`${BASE_URL}/auth/salesperson/register`, salespersonData);
    if (response.status === 201 && response.data.token) {
      logStep(3, 'Salesperson Registration', '✓ PASS', `Email: ${salespersonData.email}`);
      results.testData.salespersonToken = response.data.token;
      results.testData.salespersonId = response.data.salespersonId;
    } else {
      logStep(3, 'Salesperson Registration', '✗ FAIL', response.data.error);
      throw new Error('Salesperson registration failed');
    }
    
    // STEP 4: Salesperson Views Request
    console.log('\n📊 SALESPERSON VIEWS REQUEST');
    response = await axios.get(
      `${BASE_URL}/salesperson/requests`,
      { headers: { Authorization: `Bearer ${results.testData.salespersonToken}` } }
    );
    
    if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
      logStep(4, 'View Customer Requests', '✓ PASS', `Found ${response.data.length} request(s)`);
    } else {
      logStep(4, 'View Customer Requests', '✗ FAIL', 'No requests found');
      throw new Error('Request retrieval failed');
    }
    
    // STEP 5: Salesperson Creates Quotation
    console.log('\n📋 SALESPERSON CREATES QUOTATION');
    let quotationData = {
      lineItems: [
        {
          product: 'Business Laptop',
          quantity: 90,
          unitPrice: 50000,
          discount: 10
        }
      ],
      notes: 'Enterprise pricing, includes 1-year support',
      tax: 18,
      validUntilDays: 30
    };
    
    response = await axios.post(
      `${BASE_URL}/salesperson/requests/${results.testData.requestId}/quotation`,
      quotationData,
      { headers: { Authorization: `Bearer ${results.testData.salespersonToken}` } }
    );
    
    if (response.status === 201 && response.data.quotationId) {
      logStep(5, 'Create Quotation', '✓ PASS', `Quotation ID: ${response.data.quotationId}`);
      results.testData.quotationId = response.data.quotationId;
      console.log(`  Subtotal: ${response.data.subtotal}, Tax: ${response.data.tax}, Total: ${response.data.total}`);
    } else {
      logStep(5, 'Create Quotation', '✗ FAIL', response.data.error || 'Unknown error');
      throw new Error('Quotation creation failed');
    }
    
    // STEP 6: Salesperson Sends Quotation
    console.log('\n📤 SALESPERSON SENDS QUOTATION');
    response = await axios.post(
      `${BASE_URL}/salesperson/quotations/${results.testData.quotationId}/send`,
      {},
      { headers: { Authorization: `Bearer ${results.testData.salespersonToken}` } }
    );
    
    if (response.status === 200) {
      logStep(6, 'Send Quotation to Customer', '✓ PASS', 'Quotation sent');
      results.testData.quotationSent = true;
    } else {
      logStep(6, 'Send Quotation to Customer', '✗ FAIL', response.data.error);
      throw new Error('Quotation send failed');
    }
    
    // STEP 7: Customer Views Quotation
    console.log('\n👀 CUSTOMER VIEWS QUOTATION');
    response = await axios.get(
      `${BASE_URL}/customer/quotations`,
      { headers: { Authorization: `Bearer ${results.testData.customerToken}` } }
    );
    
    if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
      logStep(7, 'View Received Quotation', '✓ PASS', `Found ${response.data.length} quotation(s)`);
    } else {
      logStep(7, 'View Received Quotation', '✗ FAIL', 'No quotations found');
      throw new Error('Quotation retrieval failed');
    }
    
    // STEP 8: Customer Requests Discount (exceeds salesperson limit)
    console.log('\n💰 CUSTOMER REQUESTS DISCOUNT (15% > 10% limit)');
    let discountRequest = {
      quotationId: results.testData.quotationId,
      requestedDiscount: 15,
      reason: 'Bulk purchase of 90 laptops for our organization',
      message: 'We are a regular customer. Please offer better pricing.'
    };
    
    response = await axios.post(
      `${BASE_URL}/customer/quotations/${results.testData.quotationId}/discount-request`,
      discountRequest,
      { headers: { Authorization: `Bearer ${results.testData.customerToken}` } }
    );
    
    if (response.status === 201 && response.data.discountRequestId) {
      logStep(8, 'Request Discount (15%)', '✓ PASS', `Discount Request ID: ${response.data.discountRequestId}`);
      results.testData.discountRequestId = response.data.discountRequestId;
    } else {
      logStep(8, 'Request Discount (15%)', '✗ FAIL', response.data.error);
      throw new Error('Discount request failed');
    }
    
    // STEP 9: Salesperson Reviews and Approves Discount
    console.log('\n✅ SALESPERSON APPROVES DISCOUNT (triggers manager approval)');
    response = await axios.post(
      `${BASE_URL}/salesperson/discount-requests/${results.testData.discountRequestId}/approve`,
      { response: 'Approved by salesperson, forwarding to manager' },
      { headers: { Authorization: `Bearer ${results.testData.salespersonToken}` } }
    );
    
    if (response.status === 200) {
      logStep(9, 'Salesperson Approves (sent to manager)', '✓ PASS', 
        `Status: ${response.data.status}`);
      results.testData.discountSentToManager = response.data.status === 'SENT_TO_MANAGER';
    } else {
      logStep(9, 'Salesperson Approves', '✗ FAIL', response.data.error);
      throw new Error('Discount approval failed');
    }
    
    // STEP 10: Manager Registration
    console.log('\n👨‍💼 MANAGER REGISTRATION & LOGIN');
    let managerData = {
      fullName: 'Sarah Johnson',
      email: 'manager@dealflow.com',
      password: 'Manager@123'
    };
    
    response = await axios.post(`${BASE_URL}/auth/manager/register`, managerData);
    if (response.status === 201 && response.data.token) {
      logStep(10, 'Manager Registration', '✓ PASS', `Email: ${managerData.email}`);
      results.testData.managerToken = response.data.token;
      results.testData.managerId = response.data.managerId;
    } else {
      logStep(10, 'Manager Registration', '✗ FAIL', response.data.error);
      throw new Error('Manager registration failed');
    }
    
    // STEP 11: Manager Views Pending Approvals
    console.log('\n📌 MANAGER VIEWS PENDING APPROVALS');
    response = await axios.get(
      `${BASE_URL}/manager/discount-requests?status=SENT_TO_MANAGER`,
      { headers: { Authorization: `Bearer ${results.testData.managerToken}` } }
    );
    
    if (response.status === 200 && Array.isArray(response.data)) {
      logStep(11, 'View Pending Approvals', '✓ PASS', `Found ${response.data.length} pending request(s)`);
    } else {
      logStep(11, 'View Pending Approvals', '✗ FAIL', 'Failed to retrieve pending requests');
      throw new Error('Manager request retrieval failed');
    }
    
    // STEP 12: Manager Approves Discount
    console.log('\n🎯 MANAGER APPROVES DISCOUNT REQUEST');
    response = await axios.post(
      `${BASE_URL}/manager/discount-requests/${results.testData.discountRequestId}/approve`,
      { response: 'Approved. Customer is valuable for volume commitments.' },
      { headers: { Authorization: `Bearer ${results.testData.managerToken}` } }
    );
    
    if (response.status === 200) {
      logStep(12, 'Manager Approves Discount', '✓ PASS', `Status: ${response.data.status}`);
      results.testData.discountApproved = true;
    } else {
      logStep(12, 'Manager Approves Discount', '✗ FAIL', response.data.error);
      throw new Error('Manager approval failed');
    }
    
    // STEP 13: Salesperson Updates Quotation with Final Discount
    console.log('\n🔄 SALESPERSON UPDATES QUOTATION WITH APPROVED DISCOUNT');
    let updateData = {
      finalDiscount: 15,
      notes: 'Updated with manager-approved discount of 15%'
    };
    
    response = await axios.put(
      `${BASE_URL}/salesperson/quotations/${results.testData.quotationId}/update-discount`,
      updateData,
      { headers: { Authorization: `Bearer ${results.testData.salespersonToken}` } }
    );
    
    if (response.status === 200) {
      logStep(13, 'Update Quotation with Final Discount', '✓ PASS', 
        `New Total: ${response.data.total}`);
    } else {
      logStep(13, 'Update Quotation with Final Discount', '✗ FAIL', response.data.error);
      throw new Error('Quotation update failed');
    }
    
    // STEP 14: Customer Views Final Quotation
    console.log('\n👀 CUSTOMER VIEWS FINAL QUOTATION');
    response = await axios.get(
      `${BASE_URL}/customer/quotations/${results.testData.quotationId}`,
      { headers: { Authorization: `Bearer ${results.testData.customerToken}` } }
    );
    
    if (response.status === 200) {
      logStep(14, 'View Final Quotation', '✓ PASS', 
        `Status: ${response.data.status}, Total: ${response.data.total}`);
    } else {
      logStep(14, 'View Final Quotation', '✗ FAIL', response.data.error);
      throw new Error('Quotation retrieval failed');
    }
    
    // STEP 15: Customer Accepts Quotation
    console.log('\n✍️ CUSTOMER ACCEPTS QUOTATION');
    response = await axios.post(
      `${BASE_URL}/customer/quotations/${results.testData.quotationId}/accept`,
      {},
      { headers: { Authorization: `Bearer ${results.testData.customerToken}` } }
    );
    
    if (response.status === 200) {
      logStep(15, 'Accept Quotation', '✓ PASS', 'Quotation accepted successfully');
      results.testData.quotationAccepted = true;
    } else {
      logStep(15, 'Accept Quotation', '✗ FAIL', response.data.error);
      throw new Error('Quotation acceptance failed');
    }
    
    // STEP 16: Verify Complete Workflow
    console.log('\n📊 VERIFY COMPLETE WORKFLOW');
    response = await axios.get(
      `${BASE_URL}/customer/requests/${results.testData.requestId}`,
      { headers: { Authorization: `Bearer ${results.testData.customerToken}` } }
    );
    
    if (response.status === 200 && response.data.status === 'ACCEPTED') {
      logStep(16, 'Verify Request Status (ACCEPTED)', '✓ PASS', 
        `Final Status: ${response.data.status}`);
    } else {
      logStep(16, 'Verify Request Status', '✗ FAIL', 
        `Status: ${response.data.status || 'Unknown'}`);
    }
    
    // SUMMARY
    console.log('\n' + '='.repeat(70));
    console.log('📈 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✓ Passed: ${results.passed}`);
    console.log(`✗ Failed: ${results.failed}`);
    console.log(`Total: ${results.passed + results.failed}`);
    console.log('\n🎉 END-TO-END WORKFLOW TEST COMPLETE');
    console.log('\nKey Test Data:');
    console.log(`  Request ID: ${results.testData.requestId}`);
    console.log(`  Quotation ID: ${results.testData.quotationId}`);
    console.log(`  Discount Request ID: ${results.testData.discountRequestId}`);
    console.log(`  Workflow Status: ${results.testData.quotationAccepted ? 'COMPLETED ✓' : 'FAILED ✗'}`);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
testEndToEnd().then(() => {
  console.log('\n✅ All tests completed');
  process.exit(results.failed > 0 ? 1 : 0);
});
