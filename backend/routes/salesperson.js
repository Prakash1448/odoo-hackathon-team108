import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { salespersonAuthMiddleware } from '../auth.js';
import { run, get, all } from '../database.js';
import { generateQuotationNumber, logAudit, checkDiscountApprovalRequired, calculateQuotationTotals, QUOTATION_STATUS_FLOW, DISCOUNT_REQUEST_STATUS_FLOW, isValidStatusTransition } from '../business-rules.js';

const router = express.Router();

// GET /salesperson/dashboard
router.get('/dashboard', salespersonAuthMiddleware, async (req, res) => {
  try {
    const salespersonId = req.salespersonId;

    // Total Requests available
    const totalRequestsResult = await get(
      'SELECT COUNT(*) as count FROM sales_requests'
    );
    const totalRequests = totalRequestsResult?.count || 0;

    // Pending Requests (not yet quoted)
    const pendingRequestsResult = await get(
      `SELECT COUNT(*) as count FROM sales_requests 
       WHERE status IN ('SUBMITTED', 'UNDER_REVIEW')`
    );
    const pendingRequests = pendingRequestsResult?.count || 0;

    // Quotations Created by this salesperson
    const quotationsCreatedResult = await get(
      `SELECT COUNT(*) as count FROM quotations WHERE salesperson_id = ?`,
      [salespersonId]
    );
    const quotationsCreated = quotationsCreatedResult?.count || 0;

    // Quotations Sent
    const quotationsSentResult = await get(
      `SELECT COUNT(*) as count FROM quotations WHERE salesperson_id = ? AND quotation_status = 'SENT'`,
      [salespersonId]
    );
    const quotationsSent = quotationsSentResult?.count || 0;

    // Quotations in Negotiation
    const quotationsNegotiatingResult = await get(
      `SELECT COUNT(*) as count FROM quotations WHERE salesperson_id = ? AND quotation_status IN ('SENT', 'NEGOTIATION')`,
      [salespersonId]
    );
    const quotationsNegotiating = quotationsNegotiatingResult?.count || 0;

    // Active Discount Requests
    const discountRequestsResult = await get(
      `SELECT COUNT(*) as count FROM discount_requests WHERE salesperson_id = ? AND status NOT IN ('APPLIED_TO_QUOTATION', 'REJECTED', 'CANCELLED')`,
      [salespersonId]
    );
    const activeDiscountRequests = discountRequestsResult?.count || 0;

    // Discount Requests Requiring Manager Approval
    const managerApprovalResult = await get(
      `SELECT COUNT(*) as count FROM discount_requests WHERE salesperson_id = ? AND requires_manager_approval = TRUE AND status = 'SENT_TO_MANAGER'`,
      [salespersonId]
    );
    const awaitingManagerApproval = managerApprovalResult?.count || 0;

    res.json({
      totalRequests,
      pendingRequests,
      quotationsCreated,
      quotationsSent,
      quotationsNegotiating,
      activeDiscountRequests,
      awaitingManagerApproval
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /salesperson/requests - Get all customer requests
router.get('/requests', salespersonAuthMiddleware, async (req, res) => {
  try {
    const requests = await all(
      `SELECT sr.id, sr.customer_id, sr.request_title, sr.product_requirement, sr.quantity, sr.status, sr.created_at,
              c.full_name, c.company_name
       FROM sales_requests sr
       JOIN customers c ON sr.customer_id = c.id
       ORDER BY sr.created_at DESC`
    );

    const formatted = requests.map(req => ({
      id: req.id,
      customerId: req.customer_id,
      customerName: req.full_name,
      customerCompany: req.company_name,
      title: req.request_title,
      productRequirement: req.product_requirement,
      quantity: req.quantity,
      status: req.status,
      createdAt: new Date(req.created_at).toLocaleDateString('en-IN')
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /salesperson/requests/:requestId - Get request details
router.get('/requests/:requestId', salespersonAuthMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await get(
      `SELECT * FROM sales_requests WHERE id = ?`,
      [requestId]
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Get customer details
    const customer = await get(
      'SELECT id, full_name, company_name, email, phone_number FROM customers WHERE id = ?',
      [request.customer_id]
    );

    // Get associated quotations
    const quotations = await all(
      `SELECT id, quotation_number, quotation_status, total_amount, created_at FROM quotations WHERE request_id = ? ORDER BY created_at DESC`,
      [requestId]
    );

    res.json({
      ...request,
      createdAt: new Date(request.created_at).toLocaleDateString('en-IN'),
      customer,
      quotations: quotations.map(q => ({
        id: q.id,
        quotationNumber: q.quotation_number,
        status: q.quotation_status,
        totalAmount: q.total_amount,
        createdAt: new Date(q.created_at).toLocaleDateString('en-IN')
      }))
    });
  } catch (error) {
    console.error('Fetch request details error:', error);
    res.status(500).json({ error: 'Failed to fetch request details' });
  }
});

// POST /salesperson/requests/:requestId/quotation - Create quotation
router.post('/requests/:requestId/quotation', salespersonAuthMiddleware, async (req, res) => {
  try {
    const salespersonId = req.salespersonId;
    const userId = req.userId;
    const { requestId } = req.params;
    const { lineItems, discountPercent, taxPercent, validUntil, notes } = req.body;

    // Validation
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'Line items are required and must be an array' });
    }

    // Check request exists
    const request = await get(
      `SELECT * FROM sales_requests WHERE id = ?`,
      [requestId]
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Check quotation doesn't already exist for this request
    const existingQuotation = await get(
      `SELECT id FROM quotations WHERE request_id = ? AND quotation_status != 'CANCELLED'`,
      [requestId]
    );

    if (existingQuotation) {
      return res.status(400).json({ error: 'Non-cancelled quotation already exists for this request' });
    }

    // Validate line items
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.productName || item.quantity <= 0 || item.unitPrice < 0) {
        return res.status(400).json({ 
          error: `Line item ${i + 1}: productName, quantity (>0), and unitPrice (>=0) are required` 
        });
      }
    }

    // Create quotation
    const quotationId = uuidv4();
    const quotationNumber = await generateQuotationNumber();
    const discount = discountPercent || 0;
    const tax = taxPercent || 0.18; // Default 18% GST

    // Calculate totals using business rules
    const totals = calculateQuotationTotals(lineItems, discount, tax);

    // Insert quotation
    await run(
      `INSERT INTO quotations 
       (id, request_id, customer_id, salesperson_id, quotation_number, quotation_status, total_amount, discount_percent, tax_amount, notes, valid_until)
       VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?)`,
      [quotationId, requestId, request.customer_id, salespersonId, quotationNumber, totals.totalAmount, discount, totals.taxAmount, notes || '', validUntil || '']
    );

    // Insert line items
    for (const item of totals.lineItems) {
      await run(
        `INSERT INTO quotation_line_items 
         (id, quotation_id, product_name, quantity, unit_price, subtotal, discount_percent, discount_amount, tax_amount, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), quotationId, item.productName, item.quantity, item.unitPrice, 
         item.subtotal, item.discountPercent || 0, item.discountAmount, item.taxAmount, item.totalAmount]
      );
    }

    // Update request status to QUOTATION_CREATED
    await run(
      `UPDATE sales_requests SET status = 'QUOTATION_CREATED', salesperson_id = ? WHERE id = ?`,
      [salespersonId, requestId]
    );

    // Log audit
    await logAudit(userId, 'SALESPERSON', 'SALESPERSON_CREATED_QUOTATION', 'quotation', quotationId, {
      requestId,
      quotationNumber,
      totalAmount: totals.totalAmount
    });

    res.status(201).json({
      message: 'Quotation created successfully',
      quotation: {
        id: quotationId,
        quotationNumber,
        requestId,
        status: 'DRAFT',
        lineItems: totals.lineItems,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        validUntil,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

// GET /salesperson/quotations - Get all quotations
router.get('/quotations', salespersonAuthMiddleware, async (req, res) => {
  try {
    const salespersonId = req.salespersonId;

    const quotations = await all(
      `SELECT q.id, q.quotation_number, q.request_id, q.quotation_status, q.total_amount, q.created_at,
              sr.request_title, sr.product_requirement, sr.quantity,
              c.full_name, c.company_name
       FROM quotations q
       JOIN sales_requests sr ON q.request_id = sr.id
       JOIN customers c ON q.customer_id = c.id
       WHERE q.salesperson_id = ?
       ORDER BY q.created_at DESC`,
      [salespersonId]
    );

    const formatted = quotations.map(q => ({
      id: q.id,
      quotationNumber: q.quotation_number,
      requestId: q.request_id,
      requestTitle: q.request_title,
      productRequirement: q.product_requirement,
      quantity: q.quantity,
      status: q.quotation_status,
      totalAmount: q.total_amount,
      customer: {
        name: q.full_name,
        company: q.company_name
      },
      createdAt: new Date(q.created_at).toLocaleDateString('en-IN')
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch quotations error:', error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

// GET /salesperson/quotations/:quotationId - Get quotation details
router.get('/quotations/:quotationId', salespersonAuthMiddleware, async (req, res) => {
  try {
    const { quotationId } = req.params;

    const quotation = await get(
      `SELECT * FROM quotations WHERE id = ?`,
      [quotationId]
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
      `SELECT id, requested_discount_percent, current_discount_percent, reason, status, requires_manager_approval, created_at
       FROM discount_requests WHERE quotation_id = ? ORDER BY created_at DESC`,
      [quotationId]
    );

    res.json({
      id: quotation.id,
      quotationNumber: quotation.quotation_number,
      requestId: quotation.request_id,
      status: quotation.quotation_status,
      lineItems,
      subtotal: lineItems.reduce((sum, item) => sum + item.subtotal, 0),
      discountPercent: quotation.discount_percent,
      discountAmount: quotation.discount_percent ? lineItems.reduce((sum, item) => sum + item.discount_amount, 0) : 0,
      taxAmount: quotation.tax_amount,
      totalAmount: quotation.total_amount,
      validUntil: quotation.valid_until,
      notes: quotation.notes,
      createdAt: new Date(quotation.created_at).toLocaleDateString('en-IN'),
      discountRequests: discountRequests.map(dr => ({
        id: dr.id,
        requestedDiscountPercent: dr.requested_discount_percent,
        currentDiscountPercent: dr.current_discount_percent,
        reason: dr.reason,
        status: dr.status,
        requiresManagerApproval: dr.requires_manager_approval,
        createdAt: new Date(dr.created_at).toLocaleDateString('en-IN')
      }))
    });
  } catch (error) {
    console.error('Fetch quotation details error:', error);
    res.status(500).json({ error: 'Failed to fetch quotation details' });
  }
});

// POST /salesperson/quotations/:quotationId/send - Send quotation to customer
router.post('/quotations/:quotationId/send', salespersonAuthMiddleware, async (req, res) => {
  try {
    const salespersonId = req.salespersonId;
    const userId = req.userId;
    const { quotationId } = req.params;

    const quotation = await get(
      `SELECT * FROM quotations WHERE id = ?`,
      [quotationId]
    );

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Can only send draft quotations
    if (quotation.quotation_status !== 'DRAFT') {
      return res.status(400).json({ error: `Cannot send quotation with status: ${quotation.quotation_status}` });
    }

    // Update quotation status to SENT
    await run(
      `UPDATE quotations SET quotation_status = 'SENT' WHERE id = ?`,
      [quotationId]
    );

    // Update request status to QUOTATION_SENT
    await run(
      `UPDATE sales_requests SET status = 'QUOTATION_SENT' WHERE id = ?`,
      [quotation.request_id]
    );

    // Log audit
    await logAudit(userId, 'SALESPERSON', 'QUOTATION_SENT_TO_CUSTOMER', 'quotation', quotationId, {
      quotationNumber: quotation.quotation_number
    });

    res.json({
      message: 'Quotation sent successfully',
      quotation: {
        id: quotationId,
        quotationNumber: quotation.quotation_number,
        status: 'SENT',
        sentAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Send quotation error:', error);
    res.status(500).json({ error: 'Failed to send quotation' });
  }
});

// PATCH /salesperson/quotations/:quotationId - Update draft quotation
router.patch('/quotations/:quotationId', salespersonAuthMiddleware, async (req, res) => {
  try {
    const salespersonId = req.salespersonId;
    const userId = req.userId;
    const { quotationId } = req.params;
    const { notes, validUntil } = req.body;

    const quotation = await get(
      `SELECT * FROM quotations WHERE id = ?`,
      [quotationId]
    );

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Can only edit draft quotations
    if (quotation.quotation_status !== 'DRAFT') {
      return res.status(400).json({ error: `Cannot edit quotation with status: ${quotation.quotation_status}` });
    }

    // Update quotation
    await run(
      `UPDATE quotations SET notes = ?, valid_until = ? WHERE id = ?`,
      [notes !== undefined ? notes : quotation.notes, validUntil !== undefined ? validUntil : quotation.valid_until, quotationId]
    );

    // Log audit
    await logAudit(userId, 'SALESPERSON', 'QUOTATION_UPDATED', 'quotation', quotationId);

    res.json({
      message: 'Quotation updated successfully',
      quotation: {
        id: quotationId,
        quotationNumber: quotation.quotation_number,
        notes: notes !== undefined ? notes : quotation.notes,
        validUntil: validUntil !== undefined ? validUntil : quotation.valid_until,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({ error: 'Failed to update quotation' });
  }
});

// GET /salesperson/discount-requests - Get all discount requests for this salesperson
router.get('/discount-requests', salespersonAuthMiddleware, async (req, res) => {
  try {
    const salespersonId = req.salespersonId;

    const discountRequests = await all(
      `SELECT dr.*, c.full_name, c.company_name, q.quotation_number
       FROM discount_requests dr
       JOIN quotations q ON dr.quotation_id = q.id
       JOIN customers c ON dr.customer_id = c.id
       WHERE dr.salesperson_id = ?
       ORDER BY dr.created_at DESC`,
      [salespersonId]
    );

    const formatted = discountRequests.map(dr => ({
      id: dr.id,
      quotationId: dr.quotation_id,
      quotationNumber: dr.quotation_number,
      customer: {
        id: dr.customer_id,
        name: dr.full_name,
        company: dr.company_name
      },
      currentDiscountPercent: dr.current_discount_percent,
      requestedDiscountPercent: dr.requested_discount_percent,
      reason: dr.reason,
      customerMessage: dr.customer_message,
      status: dr.status,
      requiresManagerApproval: dr.requires_manager_approval,
      salespersonResponse: dr.salesperson_response,
      managerApprovalStatus: dr.manager_approval_status,
      createdAt: new Date(dr.created_at).toLocaleDateString('en-IN')
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch discount requests error:', error);
    res.status(500).json({ error: 'Failed to fetch discount requests' });
  }
});

// POST /salesperson/discount-requests/:requestId/approve - Approve discount
router.post('/discount-requests/:requestId/approve', salespersonAuthMiddleware, async (req, res) => {
  try {
    const salespersonId = req.salespersonId;
    const userId = req.userId;
    const { requestId } = req.params;
    const { response } = req.body;

    const discountRequest = await get(
      `SELECT * FROM discount_requests WHERE id = ?`,
      [requestId]
    );

    if (!discountRequest) {
      return res.status(404).json({ error: 'Discount request not found' });
    }

    if (discountRequest.salesperson_id !== salespersonId) {
      return res.status(403).json({ error: 'Not authorized to approve this discount request' });
    }

    if (discountRequest.status !== 'PENDING_SALESPERSON_REVIEW') {
      return res.status(400).json({ error: `Cannot approve discount request with status: ${discountRequest.status}` });
    }

    // Check if discount requires manager approval
    const approvalCheck = await checkDiscountApprovalRequired(salespersonId, discountRequest.requested_discount_percent);

    if (approvalCheck.requiresApproval) {
      // Update to SENT_TO_MANAGER
      await run(
        `UPDATE discount_requests SET status = 'SENT_TO_MANAGER', requires_manager_approval = TRUE, salesperson_response = ? WHERE id = ?`,
        [response || `Approved by salesperson. Forwarding to manager as requested discount (${discountRequest.requested_discount_percent}%) exceeds authority limit (${approvalCheck.maxAllowed}%).`, requestId]
      );

      // Log audit
      await logAudit(userId, 'SALESPERSON', 'DISCOUNT_SENT_TO_MANAGER', 'discount_request', requestId, {
        requestedDiscount: discountRequest.requested_discount_percent,
        reason: 'Exceeds salesperson authority'
      });

      return res.json({
        message: 'Discount request forwarded to manager for approval',
        discountRequest: {
          id: requestId,
          status: 'SENT_TO_MANAGER',
          requiresManagerApproval: true,
          reason: approvalCheck.reason
        }
      });
    }

    // Salesperson can approve directly
    await run(
      `UPDATE discount_requests SET status = 'APPROVED', salesperson_response = ? WHERE id = ?`,
      [response || `Approved. Discount ${discountRequest.requested_discount_percent}% is within authority.`, requestId]
    );

    // Log audit
    await logAudit(userId, 'SALESPERSON', 'SALESPERSON_APPROVED_DISCOUNT', 'discount_request', requestId, {
      requestedDiscountPercent: discountRequest.requested_discount_percent
    });

    res.json({
      message: 'Discount request approved successfully',
      discountRequest: {
        id: requestId,
        status: 'APPROVED',
        approvedBy: 'Salesperson',
        approvedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Approve discount error:', error);
    res.status(500).json({ error: 'Failed to approve discount request' });
  }
});

// POST /salesperson/discount-requests/:requestId/reject - Reject discount
router.post('/discount-requests/:requestId/reject', salespersonAuthMiddleware, async (req, res) => {
  try {
    const salespersonId = req.salespersonId;
    const userId = req.userId;
    const { requestId } = req.params;
    const { response } = req.body;

    const discountRequest = await get(
      `SELECT * FROM discount_requests WHERE id = ?`,
      [requestId]
    );

    if (!discountRequest) {
      return res.status(404).json({ error: 'Discount request not found' });
    }

    if (discountRequest.salesperson_id !== salespersonId) {
      return res.status(403).json({ error: 'Not authorized to reject this discount request' });
    }

    if (discountRequest.status !== 'PENDING_SALESPERSON_REVIEW' && discountRequest.status !== 'COUNTER_OFFERED') {
      return res.status(400).json({ error: `Cannot reject discount request with status: ${discountRequest.status}` });
    }

    // Update to REJECTED
    await run(
      `UPDATE discount_requests SET status = 'REJECTED', salesperson_response = ? WHERE id = ?`,
      [response || 'Discount request rejected by salesperson.', requestId]
    );

    // Log audit
    await logAudit(userId, 'SALESPERSON', 'SALESPERSON_REJECTED_DISCOUNT', 'discount_request', requestId);

    res.json({
      message: 'Discount request rejected successfully',
      discountRequest: {
        id: requestId,
        status: 'REJECTED',
        rejectedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Reject discount error:', error);
    res.status(500).json({ error: 'Failed to reject discount request' });
  }
});

// POST /salesperson/discount-requests/:requestId/counter-offer - Make counter offer
router.post('/discount-requests/:requestId/counter-offer', salespersonAuthMiddleware, async (req, res) => {
  try {
    const salespersonId = req.salespersonId;
    const userId = req.userId;
    const { requestId } = req.params;
    const { counterOfferDiscountPercent, response } = req.body;

    if (!counterOfferDiscountPercent || counterOfferDiscountPercent < 0 || counterOfferDiscountPercent > 100) {
      return res.status(400).json({ error: 'Counter offer discount must be between 0 and 100' });
    }

    const discountRequest = await get(
      `SELECT * FROM discount_requests WHERE id = ?`,
      [requestId]
    );

    if (!discountRequest) {
      return res.status(404).json({ error: 'Discount request not found' });
    }

    if (discountRequest.salesperson_id !== salespersonId) {
      return res.status(403).json({ error: 'Not authorized to make counter offer for this discount request' });
    }

    if (discountRequest.status !== 'PENDING_SALESPERSON_REVIEW') {
      return res.status(400).json({ error: `Cannot make counter offer for request with status: ${discountRequest.status}` });
    }

    // Update to COUNTER_OFFERED
    await run(
      `UPDATE discount_requests SET status = 'COUNTER_OFFERED', counter_offer_discount_percent = ?, salesperson_response = ? WHERE id = ?`,
      [counterOfferDiscountPercent, response || `Counter offer: ${counterOfferDiscountPercent}% discount instead of requested ${discountRequest.requested_discount_percent}%.`, requestId]
    );

    // Log audit
    await logAudit(userId, 'SALESPERSON', 'SALESPERSON_COUNTER_OFFER', 'discount_request', requestId, {
      counterOfferDiscountPercent,
      originalRequestedPercent: discountRequest.requested_discount_percent
    });

    res.json({
      message: 'Counter offer made successfully',
      discountRequest: {
        id: requestId,
        status: 'COUNTER_OFFERED',
        counterOfferDiscountPercent,
        madeAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Counter offer error:', error);
    res.status(500).json({ error: 'Failed to make counter offer' });
  }
});

export default router;
