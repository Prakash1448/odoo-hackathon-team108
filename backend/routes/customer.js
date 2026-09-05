import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../auth.js';
import { run, get, all } from '../database.js';

const router = express.Router();

// GET /customer/dashboard - Get dashboard summary
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const customerId = req.customerId;

    // Total Requests
    const totalRequestsResult = await get(
      'SELECT COUNT(*) as count FROM sales_requests WHERE customer_id = ?',
      [customerId]
    );
    const totalRequests = totalRequestsResult?.count || 0;

    // Pending Requests (excluding those with Quotation Received or later)
    const pendingRequestsResult = await get(
      `SELECT COUNT(*) as count FROM sales_requests 
       WHERE customer_id = ? AND status IN ('Submitted', 'Under Review')`,
      [customerId]
    );
    const pendingRequests = pendingRequestsResult?.count || 0;

    // Quotations Received
    const quotationsReceivedResult = await get(
      `SELECT COUNT(DISTINCT q.id) as count FROM quotations q
       JOIN sales_requests sr ON q.request_id = sr.id
       WHERE sr.customer_id = ? AND q.quotation_status = 'Awaiting Customer Response'`,
      [customerId]
    );
    const quotationsReceived = quotationsReceivedResult?.count || 0;

    // Quotations Awaiting Customer Action
    const quotationsAwaitingResult = await get(
      `SELECT COUNT(DISTINCT q.id) as count FROM quotations q
       JOIN sales_requests sr ON q.request_id = sr.id
       WHERE sr.customer_id = ? AND q.quotation_status IN ('Awaiting Customer Response', 'Counter Offer')`,
      [customerId]
    );
    const quotationsAwaitingAction = quotationsAwaitingResult?.count || 0;

    // Discount Requests
    const discountRequestsResult = await get(
      `SELECT COUNT(*) as count FROM discount_requests
       WHERE customer_id = ? AND status IN ('Pending Review', 'Requires Manager Approval')`,
      [customerId]
    );
    const discountRequests = discountRequestsResult?.count || 0;

    // Accepted Quotations
    const acceptedQuotationsResult = await get(
      `SELECT COUNT(*) as count FROM quotation_acceptances
       WHERE customer_id = ?`,
      [customerId]
    );
    const acceptedQuotations = acceptedQuotationsResult?.count || 0;

    res.json({
      totalRequests,
      pendingRequests,
      quotationsReceived,
      quotationsAwaitingAction,
      discountRequests,
      acceptedQuotations
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /customer/requests - Get all requests for the customer
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const customerId = req.customerId;

    const requests = await all(
      `SELECT id, request_title, product_requirement, quantity, status, created_at
       FROM sales_requests
       WHERE customer_id = ?
       ORDER BY created_at DESC`,
      [customerId]
    );

    // Format dates
    const formattedRequests = requests.map(req => ({
      ...req,
      created_at: new Date(req.created_at).toLocaleDateString('en-IN')
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// POST /customer/requests - Create a new sales request
router.post('/requests', authMiddleware, async (req, res) => {
  try {
    const customerId = req.customerId;
    const { requestTitle, productRequirement, quantity, specifications, additionalNotes, expectedDeliveryDate } = req.body;

    // Validation
    if (!requestTitle || !productRequirement || !quantity) {
      return res.status(400).json({ error: 'Request title, product requirement, and quantity are required' });
    }

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    const requestId = `REQ-${String(Date.now()).slice(-6)}`;

    await run(
      `INSERT INTO sales_requests 
       (id, customer_id, request_title, product_requirement, quantity, specifications, additional_notes, expected_delivery_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')`,
      [requestId, customerId, requestTitle, productRequirement, quantity, specifications || '', additionalNotes || '', expectedDeliveryDate || '']
    );

    res.status(201).json({
      message: 'Request created successfully',
      request: {
        id: requestId,
        requestTitle,
        productRequirement,
        quantity,
        status: 'Submitted',
        createdAt: new Date().toLocaleDateString('en-IN')
      }
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// GET /customer/requests/:requestId - Get request details
router.get('/requests/:requestId', authMiddleware, async (req, res) => {
  try {
    const customerId = req.customerId;
    const { requestId } = req.params;

    const request = await get(
      `SELECT * FROM sales_requests WHERE id = ? AND customer_id = ?`,
      [requestId, customerId]
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Get associated quotation if exists
    const quotation = await get(
      `SELECT * FROM quotations WHERE request_id = ?`,
      [requestId]
    );

    let quotationDetails = null;
    if (quotation) {
      const lineItems = await all(
        `SELECT * FROM quotation_line_items WHERE quotation_id = ?`,
        [quotation.id]
      );

      // Calculate totals
      const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
      const totalDiscount = lineItems.reduce((sum, item) => sum + item.discount_amount, 0);
      const totalTax = lineItems.reduce((sum, item) => sum + item.tax_amount, 0);
      const total = lineItems.reduce((sum, item) => sum + item.total_amount, 0);

      quotationDetails = {
        id: quotation.id,
        status: quotation.quotation_status,
        lineItems,
        subtotal: subtotal.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        totalTax: totalTax.toFixed(2),
        total: total.toFixed(2),
        validUntil: quotation.valid_until,
        notes: quotation.notes,
        createdAt: new Date(quotation.created_at).toLocaleDateString('en-IN')
      };
    }

    res.json({
      ...request,
      createdAt: new Date(request.created_at).toLocaleDateString('en-IN'),
      quotation: quotationDetails
    });
  } catch (error) {
    console.error('Fetch request details error:', error);
    res.status(500).json({ error: 'Failed to fetch request details' });
  }
});

// GET /customer/profile - Get customer profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const customer = await get(
      'SELECT id, full_name, company_name, email, phone_number, created_at FROM customers WHERE id = ?',
      [req.customerId]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      id: customer.id,
      fullName: customer.full_name,
      companyName: customer.company_name,
      email: customer.email,
      phoneNumber: customer.phone_number,
      createdAt: new Date(customer.created_at).toLocaleDateString('en-IN')
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
