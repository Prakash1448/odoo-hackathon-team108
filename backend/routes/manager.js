import express from 'express';
import { managerAuthMiddleware } from '../auth.js';
import { run, get, all } from '../database.js';
import { logAudit } from '../business-rules.js';

const router = express.Router();

// GET /manager/dashboard - Get manager dashboard metrics
router.get('/dashboard', managerAuthMiddleware, async (req, res) => {
  try {
    const managerId = req.managerId;

    // Total Requests in System
    const totalRequestsResult = await get(
      'SELECT COUNT(*) as count FROM sales_requests'
    );
    const totalRequests = totalRequestsResult?.count || 0;

    // Pending Discount Approvals
    const pendingApprovalsResult = await get(
      `SELECT COUNT(*) as count FROM discount_requests 
       WHERE status = 'SENT_TO_MANAGER' AND requires_manager_approval = TRUE`
    );
    const pendingApprovals = pendingApprovalsResult?.count || 0;

    // Approved Today
    const approvedTodayResult = await get(
      `SELECT COUNT(*) as count FROM discount_requests 
       WHERE status = 'APPROVED' AND DATE(manager_approval_date) = CURDATE() 
       AND manager_id = ?`,
      [managerId]
    );
    const approvedToday = approvedTodayResult?.count || 0;

    // Rejected Today
    const rejectedTodayResult = await get(
      `SELECT COUNT(*) as count FROM discount_requests 
       WHERE status = 'REJECTED' AND DATE(manager_approval_date) = CURDATE()
       AND manager_id = ?`,
      [managerId]
    );
    const rejectedToday = rejectedTodayResult?.count || 0;

    // Awaiting Manager Approval (all time)
    const awaitingApprovalResult = await get(
      `SELECT COUNT(*) as count FROM discount_requests 
       WHERE requires_manager_approval = TRUE AND status = 'SENT_TO_MANAGER'`
    );
    const awaitingManagerApproval = awaitingApprovalResult?.count || 0;

    res.json({
      totalRequests,
      pendingApprovals,
      approvedToday,
      rejectedToday,
      awaitingManagerApproval
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /manager/discount-requests - Get discount requests requiring manager approval
router.get('/discount-requests', managerAuthMiddleware, async (req, res) => {
  try {
    const status = req.query.status || 'SENT_TO_MANAGER';
    let query = `
      SELECT dr.id, dr.quotation_id, dr.customer_id, dr.salesperson_id, 
             dr.requested_discount, dr.status, dr.created_at,
             c.full_name as customer_name, c.company_name,
             sp.full_name as salesperson_name,
             q.total_amount, q.quotation_status
      FROM discount_requests dr
      JOIN customers c ON dr.customer_id = c.id
      JOIN salespersons sp ON dr.salesperson_id = sp.id
      JOIN quotations q ON dr.quotation_id = q.id
      WHERE dr.requires_manager_approval = TRUE
    `;
    
    const params = [];
    
    if (status !== 'all' && status) {
      query += ` AND dr.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY dr.created_at DESC`;
    
    const requests = await all(query, params);
    
    const formatted = requests.map(req => ({
      id: req.id,
      quotationId: req.quotation_id,
      customerId: req.customer_id,
      salespersonId: req.salesperson_id,
      customerName: req.customer_name,
      customerCompany: req.company_name,
      salespersonName: req.salesperson_name,
      requestedDiscount: req.requested_discount,
      quotationTotal: req.total_amount,
      status: req.status,
      quotationStatus: req.quotation_status,
      createdAt: new Date(req.created_at).toLocaleDateString('en-IN')
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Fetch discount requests error:', error);
    res.status(500).json({ error: 'Failed to fetch discount requests' });
  }
});

// GET /manager/discount-requests/:discountRequestId - Get specific discount request details
router.get('/discount-requests/:discountRequestId', managerAuthMiddleware, async (req, res) => {
  try {
    const { discountRequestId } = req.params;

    const discountRequest = await get(
      `SELECT dr.*, 
              c.full_name as customer_name, c.company_name, c.email as customer_email,
              sp.full_name as salesperson_name, sp.email as salesperson_email,
              q.id as quotation_id, q.quotation_number, q.total_amount
       FROM discount_requests dr
       JOIN customers c ON dr.customer_id = c.id
       JOIN salespersons sp ON dr.salesperson_id = sp.id
       JOIN quotations q ON dr.quotation_id = q.id
       WHERE dr.id = ?`,
      [discountRequestId]
    );

    if (!discountRequest) {
      return res.status(404).json({ error: 'Discount request not found' });
    }

    // Get quotation line items
    const lineItems = await all(
      `SELECT * FROM quotation_line_items WHERE quotation_id = ?`,
      [discountRequest.quotation_id]
    );

    res.json({
      id: discountRequest.id,
      quotationId: discountRequest.quotation_id,
      quotationNumber: discountRequest.quotation_number,
      customerId: discountRequest.customer_id,
      salespersonId: discountRequest.salesperson_id,
      customerName: discountRequest.customer_name,
      customerCompany: discountRequest.company_name,
      customerEmail: discountRequest.customer_email,
      salespersonName: discountRequest.salesperson_name,
      salespersonEmail: discountRequest.salesperson_email,
      currentDiscount: discountRequest.current_discount_percent,
      requestedDiscount: discountRequest.requested_discount,
      quotationTotal: discountRequest.total_amount,
      reason: discountRequest.reason,
      message: discountRequest.message,
      status: discountRequest.status,
      salespersonResponse: discountRequest.salesperson_response,
      lineItems: lineItems,
      createdAt: new Date(discountRequest.created_at).toLocaleDateString('en-IN')
    });
  } catch (error) {
    console.error('Fetch discount request detail error:', error);
    res.status(500).json({ error: 'Failed to fetch discount request details' });
  }
});

// POST /manager/discount-requests/:discountRequestId/approve - Manager approves discount
router.post('/discount-requests/:discountRequestId/approve', managerAuthMiddleware, async (req, res) => {
  try {
    const { discountRequestId } = req.params;
    const { response } = req.body;
    const managerId = req.managerId;
    const userId = req.userId;

    // Get discount request
    const discountRequest = await get(
      'SELECT * FROM discount_requests WHERE id = ?',
      [discountRequestId]
    );

    if (!discountRequest) {
      return res.status(404).json({ error: 'Discount request not found' });
    }

    if (discountRequest.status !== 'SENT_TO_MANAGER') {
      return res.status(400).json({ error: 'Discount request cannot be approved in current status' });
    }

    // Update discount request
    await run(
      `UPDATE discount_requests 
       SET status = 'APPROVED', manager_id = ?, manager_response = ?, manager_approval_date = NOW()
       WHERE id = ?`,
      [managerId, response || '', discountRequestId]
    );

    // Log audit
    await logAudit(userId, 'SALES_MANAGER', 'MANAGER_APPROVED_DISCOUNT', 'discount_request', discountRequestId, {
      response,
      requestedDiscount: discountRequest.requested_discount
    });

    res.json({
      message: 'Discount approved by manager',
      status: 'APPROVED',
      discountRequestId
    });
  } catch (error) {
    console.error('Manager approve error:', error);
    res.status(500).json({ error: 'Failed to approve discount request' });
  }
});

// POST /manager/discount-requests/:discountRequestId/reject - Manager rejects discount
router.post('/discount-requests/:discountRequestId/reject', managerAuthMiddleware, async (req, res) => {
  try {
    const { discountRequestId } = req.params;
    const { response } = req.body;
    const managerId = req.managerId;
    const userId = req.userId;

    // Get discount request
    const discountRequest = await get(
      'SELECT * FROM discount_requests WHERE id = ?',
      [discountRequestId]
    );

    if (!discountRequest) {
      return res.status(404).json({ error: 'Discount request not found' });
    }

    if (discountRequest.status !== 'SENT_TO_MANAGER') {
      return res.status(400).json({ error: 'Discount request cannot be rejected in current status' });
    }

    // Update discount request
    await run(
      `UPDATE discount_requests 
       SET status = 'REJECTED', manager_id = ?, manager_response = ?, manager_approval_date = NOW()
       WHERE id = ?`,
      [managerId, response || '', discountRequestId]
    );

    // Log audit
    await logAudit(userId, 'SALES_MANAGER', 'MANAGER_REJECTED_DISCOUNT', 'discount_request', discountRequestId, {
      response,
      requestedDiscount: discountRequest.requested_discount
    });

    res.json({
      message: 'Discount rejected by manager',
      status: 'REJECTED',
      discountRequestId
    });
  } catch (error) {
    console.error('Manager reject error:', error);
    res.status(500).json({ error: 'Failed to reject discount request' });
  }
});

// POST /manager/discount-requests/:discountRequestId/counter-offer - Manager makes counter offer
router.post('/discount-requests/:discountRequestId/counter-offer', managerAuthMiddleware, async (req, res) => {
  try {
    const { discountRequestId } = req.params;
    const { counterOfferDiscount, response } = req.body;
    const managerId = req.managerId;
    const userId = req.userId;

    if (counterOfferDiscount === undefined || counterOfferDiscount < 0 || counterOfferDiscount > 100) {
      return res.status(400).json({ error: 'Invalid counter offer discount percentage' });
    }

    // Get discount request
    const discountRequest = await get(
      'SELECT * FROM discount_requests WHERE id = ?',
      [discountRequestId]
    );

    if (!discountRequest) {
      return res.status(404).json({ error: 'Discount request not found' });
    }

    if (discountRequest.status !== 'SENT_TO_MANAGER') {
      return res.status(400).json({ error: 'Discount request cannot be counter-offered in current status' });
    }

    // Update discount request with counter offer
    await run(
      `UPDATE discount_requests 
       SET status = 'COUNTER_OFFERED', manager_id = ?, counter_offer_discount = ?, 
           manager_response = ?, manager_approval_date = NOW()
       WHERE id = ?`,
      [managerId, counterOfferDiscount, response || '', discountRequestId]
    );

    // Log audit
    await logAudit(userId, 'SALES_MANAGER', 'MANAGER_COUNTER_OFFER', 'discount_request', discountRequestId, {
      counterOfferDiscount,
      originalRequest: discountRequest.requested_discount,
      response
    });

    res.json({
      message: 'Counter offer made by manager',
      status: 'COUNTER_OFFERED',
      counterOfferDiscount,
      discountRequestId
    });
  } catch (error) {
    console.error('Manager counter offer error:', error);
    res.status(500).json({ error: 'Failed to make counter offer' });
  }
});

export default router;
