import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../auth.js';
import { run, get, all } from '../database.js';

const router = express.Router();

// GET /quotations - Get all quotations for the customer
router.get('/', authMiddleware, async (req, res) => {
  try {
    const customerId = req.customerId;

    const quotations = await all(
      `SELECT q.id, q.request_id, q.quotation_status, q.valid_until, q.created_at, 
              sr.request_title, sr.product_requirement, sr.quantity
       FROM quotations q
       JOIN sales_requests sr ON q.request_id = sr.id
       WHERE q.customer_id = ?
       ORDER BY q.created_at DESC`,
      [customerId]
    );

    const formattedQuotations = quotations.map(q => ({
      id: q.id,
      requestId: q.request_id,
      requestTitle: q.request_title,
      productRequirement: q.product_requirement,
      quantity: q.quantity,
      status: q.quotation_status,
      validUntil: q.valid_until,
      createdAt: new Date(q.created_at).toLocaleDateString('en-IN')
    }));

    res.json(formattedQuotations);
  } catch (error) {
    console.error('Fetch quotations error:', error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

// GET /quotations/:quotationId - Get quotation details
router.get('/:quotationId', authMiddleware, async (req, res) => {
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

    const lineItems = await all(
      `SELECT * FROM quotation_line_items WHERE quotation_id = ?`,
      [quotationId]
    );

    const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = lineItems.reduce((sum, item) => sum + item.discount_amount, 0);
    const totalTax = lineItems.reduce((sum, item) => sum + item.tax_amount, 0);
    const total = lineItems.reduce((sum, item) => sum + item.total_amount, 0);

    // Check if accepted
    const acceptance = await get(
      `SELECT * FROM quotation_acceptances WHERE quotation_id = ?`,
      [quotationId]
    );

    // Get discount requests
    const discountRequests = await all(
      `SELECT * FROM discount_requests WHERE quotation_id = ? ORDER BY created_at DESC`,
      [quotationId]
    );

    res.json({
      id: quotation.id,
      requestId: quotation.request_id,
      status: quotation.quotation_status,
      lineItems,
      subtotal: subtotal.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      totalTax: totalTax.toFixed(2),
      total: total.toFixed(2),
      validUntil: quotation.valid_until,
      notes: quotation.notes,
      createdAt: new Date(quotation.created_at).toLocaleDateString('en-IN'),
      accepted: !!acceptance,
      acceptedAt: acceptance ? new Date(acceptance.accepted_at).toLocaleDateString('en-IN') : null,
      discountRequests: discountRequests.map(dr => ({
        id: dr.id,
        requestedDiscount: dr.requested_discount_percent,
        currentDiscount: dr.current_discount_percent,
        reason: dr.reason,
        status: dr.status,
        salespersonResponse: dr.salesperson_response,
        managerApprovalStatus: dr.manager_approval_status,
        createdAt: new Date(dr.created_at).toLocaleDateString('en-IN')
      }))
    });
  } catch (error) {
    console.error('Fetch quotation details error:', error);
    res.status(500).json({ error: 'Failed to fetch quotation details' });
  }
});

// POST /quotations/:quotationId/discount-request - Request discount
router.post('/:quotationId/discount-request', authMiddleware, async (req, res) => {
  try {
    const customerId = req.customerId;
    const { quotationId } = req.params;
    const { requestedDiscountPercent, reason, customerMessage } = req.body;

    // Validation
    if (!requestedDiscountPercent || !reason) {
      return res.status(400).json({ error: 'Requested discount and reason are required' });
    }

    if (requestedDiscountPercent <= 0 || requestedDiscountPercent > 100) {
      return res.status(400).json({ error: 'Discount must be between 0 and 100' });
    }

    // Check quotation exists and belongs to customer
    const quotation = await get(
      `SELECT * FROM quotations WHERE id = ? AND customer_id = ?`,
      [quotationId, customerId]
    );

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Check if a pending discount request already exists
    const existingRequest = await get(
      `SELECT * FROM discount_requests WHERE quotation_id = ? AND status IN ('Pending Review', 'Requires Manager Approval')`,
      [quotationId]
    );

    if (existingRequest) {
      return res.status(400).json({ error: 'An active discount request already exists for this quotation' });
    }

    // Get current discount from quotation line items
    const lineItems = await all(
      `SELECT * FROM quotation_line_items WHERE quotation_id = ?`,
      [quotationId]
    );

    const currentDiscountPercent = lineItems.length > 0 ? lineItems[0].discount_percent : 0;

    const discountRequestId = uuidv4();

    await run(
      `INSERT INTO discount_requests 
       (id, quotation_id, customer_id, requested_discount_percent, current_discount_percent, reason, customer_message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending Review')`,
      [discountRequestId, quotationId, customerId, requestedDiscountPercent, currentDiscountPercent, reason, customerMessage || '']
    );

    res.status(201).json({
      message: 'Discount request submitted successfully',
      discountRequest: {
        id: discountRequestId,
        requestedDiscount: requestedDiscountPercent,
        currentDiscount: currentDiscountPercent,
        reason,
        status: 'Pending Review',
        createdAt: new Date().toLocaleDateString('en-IN')
      }
    });
  } catch (error) {
    console.error('Create discount request error:', error);
    res.status(500).json({ error: 'Failed to create discount request' });
  }
});

// POST /quotations/:quotationId/accept - Accept quotation
router.post('/:quotationId/accept', authMiddleware, async (req, res) => {
  try {
    const customerId = req.customerId;
    const { quotationId } = req.params;

    // Check quotation exists and belongs to customer
    const quotation = await get(
      `SELECT * FROM quotations WHERE id = ? AND customer_id = ?`,
      [quotationId, customerId]
    );

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Check if already accepted
    const existingAcceptance = await get(
      `SELECT * FROM quotation_acceptances WHERE quotation_id = ?`,
      [quotationId]
    );

    if (existingAcceptance) {
      return res.status(400).json({ error: 'Quotation has already been accepted' });
    }

    // Check quotation status - cannot accept rejected or expired
    if (quotation.quotation_status === 'Rejected' || quotation.quotation_status === 'Expired') {
      return res.status(400).json({ error: `Cannot accept a ${quotation.quotation_status.toLowerCase()} quotation` });
    }

    const acceptanceId = uuidv4();

    // Record acceptance
    await run(
      `INSERT INTO quotation_acceptances (id, quotation_id, customer_id, acceptance_status)
       VALUES (?, ?, ?, 'Accepted')`,
      [acceptanceId, quotationId, customerId]
    );

    // Update quotation status
    await run(
      `UPDATE quotations SET quotation_status = 'Accepted' WHERE id = ?`,
      [quotationId]
    );

    // Update request status to Approved
    await run(
      `UPDATE sales_requests SET status = 'Approved' WHERE id = 
       (SELECT request_id FROM quotations WHERE id = ?)`,
      [quotationId]
    );

    res.json({
      message: 'Quotation accepted successfully',
      acceptance: {
        id: acceptanceId,
        quotationId,
        status: 'Accepted',
        acceptedAt: new Date().toLocaleDateString('en-IN')
      }
    });
  } catch (error) {
    console.error('Accept quotation error:', error);
    res.status(500).json({ error: 'Failed to accept quotation' });
  }
});

export default router;
