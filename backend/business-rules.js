import { v4 as uuidv4 } from 'uuid';
import { run, get } from './database.js';

// Audit logging
export async function logAudit(userId, userRole, action, entityType, entityId, details = null) {
  try {
    const auditId = uuidv4();
    await run(
      `INSERT INTO audit_logs (id, user_id, user_role, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [auditId, userId, userRole, action, entityType, entityId, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

// Generate quotation number (Q-XXXXX)
export async function generateQuotationNumber() {
  const lastQuote = await get(
    `SELECT quotation_number FROM quotations WHERE quotation_number LIKE 'Q-%' ORDER BY created_at DESC LIMIT 1`
  );
  
  if (!lastQuote) {
    return 'Q-00001';
  }
  
  const lastNumber = parseInt(lastQuote.quotation_number.split('-')[1]);
  return `Q-${String(lastNumber + 1).padStart(5, '0')}`;
}

// Generate request number (REQ-XXXXX)
export async function generateRequestNumber() {
  const lastRequest = await get(
    `SELECT id FROM sales_requests WHERE id LIKE 'REQ-%' ORDER BY created_at DESC LIMIT 1`
  );
  
  if (!lastRequest) {
    return 'REQ-00001';
  }
  
  const lastNumber = parseInt(lastRequest.id.split('-')[1]);
  return `REQ-${String(lastNumber + 1).padStart(5, '0')}`;
}

// Check if discount requires manager approval
export async function checkDiscountApprovalRequired(salespersonId, requestedDiscountPercent) {
  try {
    // Get salesperson's max discount limit
    const salesperson = await get(
      'SELECT max_discount_percent FROM salespersons WHERE id = ?',
      [salespersonId]
    );
    
    if (!salesperson) {
      return { requiresApproval: false, maxAllowed: 0, reason: 'Salesperson not found' };
    }
    
    const maxAllowed = salesperson.max_discount_percent || 10;
    
    if (requestedDiscountPercent > maxAllowed) {
      return {
        requiresApproval: true,
        maxAllowed,
        reason: `Requested discount (${requestedDiscountPercent}%) exceeds salesperson limit (${maxAllowed}%)`
      };
    }
    
    return {
      requiresApproval: false,
      maxAllowed,
      reason: 'Discount within salesperson authority'
    };
  } catch (error) {
    console.error('Error checking discount approval:', error);
    return { requiresApproval: false, maxAllowed: 0, reason: 'Error checking approval' };
  }
}

// Calculate quotation totals
export function calculateQuotationTotals(lineItems, finalDiscountPercent = 0, taxRate = 0.18) {
  let subtotal = 0;
  let discountAmount = 0;
  let taxAmount = 0;
  let totalAmount = 0;
  
  // Calculate line items
  const processedItems = lineItems.map(item => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscountAmount = (itemSubtotal * (item.discountPercent || 0)) / 100;
    const itemAfterDiscount = itemSubtotal - itemDiscountAmount;
    const itemTax = (itemAfterDiscount * taxRate);
    const itemTotal = itemAfterDiscount + itemTax;
    
    subtotal += itemSubtotal;
    discountAmount += itemDiscountAmount;
    taxAmount += itemTax;
    totalAmount += itemTotal;
    
    return {
      ...item,
      subtotal: itemSubtotal,
      discountAmount: itemDiscountAmount,
      taxAmount: itemTax,
      totalAmount: itemTotal
    };
  });
  
  // Apply final discount (overall)
  const finalDiscountAmount = (subtotal * (finalDiscountPercent || 0)) / 100;
  const finalTaxAmount = ((subtotal - finalDiscountAmount) * taxRate);
  const finalTotal = (subtotal - finalDiscountAmount) + finalTaxAmount;
  
  return {
    lineItems: processedItems,
    subtotal,
    discountAmount: finalDiscountAmount,
    taxAmount: finalTaxAmount,
    totalAmount: finalTotal,
    discountPercent: finalDiscountPercent || 0
  };
}

// Request status flow validation
export const REQUEST_STATUS_FLOW = {
  'SUBMITTED': ['UNDER_REVIEW', 'CANCELLED'],
  'UNDER_REVIEW': ['QUOTATION_CREATED', 'REJECTED'],
  'QUOTATION_CREATED': ['QUOTATION_SENT', 'UNDER_REVIEW'],
  'QUOTATION_SENT': ['NEGOTIATION', 'REJECTED'],
  'NEGOTIATION': ['FINALIZED', 'UNDER_REVIEW', 'REJECTED'],
  'FINALIZED': ['ACCEPTED', 'NEGOTIATION'],
  'ACCEPTED': ['COMPLETED'],
  'COMPLETED': [],
  'CANCELLED': [],
  'REJECTED': []
};

// Quotation status flow validation
export const QUOTATION_STATUS_FLOW = {
  'DRAFT': ['SENT', 'CANCELLED'],
  'SENT': ['AWAITING_RESPONSE', 'DRAFT'],
  'AWAITING_RESPONSE': ['NEGOTIATION', 'ACCEPTED', 'REJECTED'],
  'NEGOTIATION': ['AWAITING_RESPONSE', 'FINALIZED', 'REJECTED'],
  'FINALIZED': ['ACCEPTED', 'REJECTED'],
  'ACCEPTED': ['COMPLETED'],
  'COMPLETED': [],
  'CANCELLED': [],
  'REJECTED': []
};

// Validate status transition
export function isValidStatusTransition(currentStatus, newStatus, flowMap) {
  if (!flowMap[currentStatus]) {
    return false;
  }
  return flowMap[currentStatus].includes(newStatus);
}

// Discount request status flow
export const DISCOUNT_REQUEST_STATUS_FLOW = {
  'PENDING_SALESPERSON_REVIEW': ['APPROVED', 'REJECTED', 'COUNTER_OFFERED', 'SENT_TO_MANAGER'],
  'SENT_TO_MANAGER': ['MANAGER_APPROVED', 'MANAGER_REJECTED', 'MANAGER_COUNTER_OFFERED'],
  'COUNTER_OFFERED': ['CUSTOMER_REVIEWING', 'REJECTED'],
  'CUSTOMER_REVIEWING': ['ACCEPTED_BY_CUSTOMER', 'CUSTOMER_REJECTED'],
  'APPROVED': ['APPLIED_TO_QUOTATION'],
  'MANAGER_APPROVED': ['APPLIED_TO_QUOTATION'],
  'MANAGER_COUNTER_OFFERED': ['CUSTOMER_REVIEWING', 'REJECTED'],
  'APPLIED_TO_QUOTATION': ['QUOTATION_FINALIZED'],
  'QUOTATION_FINALIZED': [],
  'REJECTED': [],
  'CANCELLED': []
};
