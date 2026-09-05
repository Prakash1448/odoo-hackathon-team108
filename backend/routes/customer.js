import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../auth.js';
import { run, get, all } from '../database.js';
import { generateRequestNumber, logAudit } from '../business-rules.js';

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

    // Pending Requests
    const pendingRequestsResult = await get(
      `SELECT COUNT(*) as count FROM sales_requests 
       WHERE customer_id = ? AND status IN ('SUBMITTED', 'UNDER_REVIEW')`,
      [customerId]
    );
    const pendingRequests = pendingRequestsResult?.count || 0;

    // Quotations Received
    const quotationsReceivedResult = await get(
      `SELECT COUNT(DISTINCT q.id) as count FROM quotations q
       JOIN sales_requests sr ON q.request_id = sr.id
       WHERE sr.customer_id = ? AND q.quotation_status = 'SENT'`,
      [customerId]
    );
    const quotationsReceived = quotationsReceivedResult?.count || 0;

    // Quotations Awaiting Customer Action
    const quotationsAwaitingResult = await get(
      `SELECT COUNT(DISTINCT q.id) as count FROM quotations q
       JOIN sales_requests sr ON q.request_id = sr.id
       WHERE sr.customer_id = ? AND q.quotation_status IN ('SENT', 'NEGOTIATION')`,
      [customerId]
    );
    const quotationsAwaitingAction = quotationsAwaitingResult?.count || 0;

    // Discount Requests
    const discountRequestsResult = await get(
      `SELECT COUNT(*) as count FROM discount_requests
       WHERE customer_id = ? AND status NOT IN ('APPLIED_TO_QUOTATION', 'REJECTED', 'CANCELLED')`,
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
    const userId = req.userId;
    const { requestTitle, productRequirement, quantity, specifications, additionalNotes, expectedDeliveryDate } = req.body;

    // Validation
    if (!requestTitle || !productRequirement || !quantity) {
      return res.status(400).json({ error: 'Request title, product requirement, and quantity are required' });
    }

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    const requestId = await generateRequestNumber();

    await run(
      `INSERT INTO sales_requests 
       (id, customer_id, request_title, product_requirement, quantity, specifications, additional_notes, expected_delivery_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')`,
      [requestId, customerId, requestTitle, productRequirement, quantity, specifications || '', additionalNotes || '', expectedDeliveryDate || '']
    );

    // Log audit
    await logAudit(userId, 'CUSTOMER', 'CUSTOMER_CREATED_REQUEST', 'sales_request', requestId, {
      requestTitle,
      productRequirement,
      quantity
    });

    res.status(201).json({
      message: 'Request created successfully',
      request: {
        id: requestId,
        requestTitle,
        productRequirement,
        quantity,
        status: 'SUBMITTED',
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
        quotationNumber: quotation.quotation_number,
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

// GET /customer/quotations - Get all quotations for the customer
router.get('/quotations', authMiddleware, async (req, res) => {
  try {
    const customerId = req.customerId;

    const quotations = await all(
      `SELECT q.id, q.quotation_number, q.request_id, q.total_amount, q.quotation_status, q.created_at
       FROM quotations q
       WHERE q.customer_id = ?
       ORDER BY q.created_at DESC`,
      [customerId]
    );

    const formattedQuotations = quotations.map(q => ({
      ...q,
      created_at: new Date(q.created_at).toLocaleDateString('en-IN')
    }));

    res.json(formattedQuotations);
  } catch (error) {
    console.error('Fetch quotations error:', error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

// GET /customer/quotations/:quotationId - Get quotation details
router.get('/quotations/:quotationId', authMiddleware, async (req, res) => {
  try {
    const customerId = req.customerId;
    const { quotationId } = req.params;

    const quotation = await get(
      `SELECT * FROM quotations WHERE id = ? AND customer_id = ?`,
      [quotationId, customerId]
    );

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Get line items
    const lineItems = await all(
      `SELECT * FROM quotation_line_items WHERE quotation_id = ?`,
      [quotationId]
    );

    // Get discount requests
    const discountRequests = await all(
      `SELECT id, requested_discount_percent, current_discount_percent, reason, status, created_at
       FROM discount_requests
       WHERE quotation_id = ?
       ORDER BY created_at DESC`,
      [quotationId]
    );

    // Get acceptance status
    const acceptance = await get(
      `SELECT * FROM quotation_acceptances WHERE quotation_id = ? AND customer_id = ?`,
      [quotationId, customerId]
    );

    res.json({
      ...quotation,
      lineItems,
      discountRequests,
      acceptance: acceptance ? {
        id: acceptance.id,
        status: acceptance.acceptance_status,
        acceptedAt: acceptance.accepted_at
      } : null,
      created_at: new Date(quotation.created_at).toLocaleDateString('en-IN')
    });
  } catch (error) {
    console.error('Fetch quotation details error:', error);
    res.status(500).json({ error: 'Failed to fetch quotation details' });
  }
});

// POST /customer/quotations/:quotationId/discount-request - Request discount
router.post('/quotations/:quotationId/discount-request', authMiddleware, async (req, res) => {
  try {
    const customerId = req.customerId;
    const userId = req.userId;
    const { quotationId } = req.params;
    const { requestedDiscountPercent, reason, message } = req.body;

    // Validation
    if (!requestedDiscountPercent || !reason) {
      return res.status(400).json({ error: 'Requested discount and reason are required' });
    }

    if (requestedDiscountPercent <= 0 || requestedDiscountPercent > 100) {
      return res.status(400).json({ error: 'Discount must be between 0 and 100' });
    }

    // Verify quotation belongs to customer
    const quotation = await get(
      `SELECT q.*, sr.salesperson_id FROM quotations q
       JOIN sales_requests sr ON q.request_id = sr.id
       WHERE q.id = ? AND q.customer_id = ?`,
      [quotationId, customerId]
    );

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Check if already has pending discount request
    const existingRequest = await get(
      `SELECT id FROM discount_requests
       WHERE quotation_id = ? AND status = 'PENDING_SALESPERSON_REVIEW'`,
      [quotationId]
    );

    if (existingRequest) {
      return res.status(400).json({ error: 'A discount request is already pending for this quotation' });
    }

    // Create discount request
    const discountRequestId = uuidv4();
    await run(
      `INSERT INTO discount_requests 
       (id, quotation_id, customer_id, salesperson_id, requested_discount_percent, current_discount_percent, reason, customer_message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_SALESPERSON_REVIEW')`,
      [discountRequestId, quotationId, customerId, quotation.salesperson_id, requestedDiscountPercent, quotation.discount_percent || 0, reason, message || '']
    );

    // Log audit
    await logAudit(userId, 'CUSTOMER', 'CUSTOMER_REQUESTED_DISCOUNT', 'discount_request', discountRequestId, {
      quotationId,
      requestedDiscountPercent,
      reason
    });

    res.status(201).json({
      message: 'Discount request submitted successfully',
      discountRequest: {
        id: discountRequestId,
        quotationId,
        requestedDiscountPercent,
        status: 'PENDING_SALESPERSON_REVIEW',
        createdAt: new Date().toLocaleDateString('en-IN')
      }
    });
  } catch (error) {
    console.error('Create discount request error:', error);
    res.status(500).json({ error: 'Failed to create discount request' });
  }
});

// POST /customer/quotations/:quotationId/accept - Accept quotation
router.post('/quotations/:quotationId/accept', authMiddleware, async (req, res) => {
  try {
    const customerId = req.customerId;
    const userId = req.userId;
    const { quotationId } = req.params;

    // Verify quotation belongs to customer
    const quotation = await get(
      `SELECT * FROM quotations WHERE id = ? AND customer_id = ?`,
      [quotationId, customerId]
    );

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Check if already accepted
    const existingAcceptance = await get(
      `SELECT id FROM quotation_acceptances WHERE quotation_id = ? AND customer_id = ?`,
      [quotationId, customerId]
    );

    if (existingAcceptance) {
      return res.status(400).json({ error: 'This quotation has already been accepted' });
    }

    // Create acceptance record
    const acceptanceId = uuidv4();
    await run(
      `INSERT INTO quotation_acceptances (id, quotation_id, customer_id, acceptance_status)
       VALUES (?, ?, ?, 'ACCEPTED')`,
      [acceptanceId, quotationId, customerId]
    );

    // Update quotation status to ACCEPTED
    await run(
      `UPDATE quotations SET quotation_status = 'ACCEPTED' WHERE id = ?`,
      [quotationId]
    );

    // Update request status to ACCEPTED
    await run(
      `UPDATE sales_requests SET status = 'ACCEPTED' WHERE id = ?`,
      [quotation.request_id]
    );

    // Log audit
    await logAudit(userId, 'CUSTOMER', 'QUOTATION_ACCEPTED', 'quotation', quotationId, {
      amount: quotation.total_amount
    });

    res.json({
      message: 'Quotation accepted successfully',
      acceptance: {
        id: acceptanceId,
        quotationId,
        status: 'ACCEPTED',
        acceptedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Accept quotation error:', error);
    res.status(500).json({ error: 'Failed to accept quotation' });
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
