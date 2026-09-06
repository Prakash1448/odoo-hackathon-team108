#!/usr/bin/env python3
"""
Test script for customer negotiation feature
Tests: Customer proposes discount -> appears in sales rep dashboard -> sales rep responds
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# Test credentials
CUSTOMER_CREDS = {
    "email": "customer@dealflow360.com",
    "password": "customer123"
}

SALES_REP_CREDS = {
    "email": "salesman@dealflow360.com",
    "password": "salesman123"
}

def log(msg):
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def login(creds):
    """Login and get access token"""
    log(f"Logging in as {creds['email']}...")
    response = requests.post(f"{BASE_URL}/api/auth/login", json=creds)
    if response.status_code != 200:
        log(f"❌ Login failed: {response.text}")
        return None
    
    token = response.json().get("access_token")
    log(f"✓ Login successful, token: {token[:20]}...")
    return token

def get_customer_quotes(token):
    """Get all quotations for logged-in customer"""
    log("Fetching customer quotations...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/portal/quotes", headers=headers)
    
    if response.status_code != 200:
        log(f"❌ Failed to fetch quotes: {response.text}")
        return []
    
    quotes = response.json()
    log(f"✓ Found {len(quotes)} quotations")
    for q in quotes:
        log(f"  - Quote {q['id']}: {q['customer']} | Status: {q['status']} | Amount: ${q['amount']}")
    
    return quotes

def propose_discount(token, quote_id, discount_percent, message):
    """Customer proposes discount on a quote"""
    log(f"Proposing {discount_percent}% discount on quote {quote_id}...")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "proposedDiscount": discount_percent,
        "comment": message
    }
    
    response = requests.post(
        f"{BASE_URL}/api/portal/quotes/{quote_id}/negotiate",
        headers=headers,
        json=payload
    )
    
    if response.status_code != 200:
        log(f"❌ Failed to propose discount: {response.text}")
        return False
    
    result = response.json()
    log(f"✓ Discount proposed successfully")
    log(f"  - Status: {result.get('status')}")
    log(f"  - Proposed Amount: ${result.get('proposedAmount')}")
    return True

def get_quote_detail(token, quote_id):
    """Get detailed quote with negotiation history"""
    log(f"Fetching detailed quote {quote_id}...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/portal/quotes/{quote_id}", headers=headers)
    
    if response.status_code != 200:
        log(f"❌ Failed to fetch quote detail: {response.text}")
        return None
    
    quote = response.json()
    log(f"✓ Quote detail retrieved")
    log(f"  - Status: {quote['status']}")
    log(f"  - Current Discount: {quote.get('discount', 0)}%")
    
    if quote.get('negotiationLog'):
        log(f"  - Negotiation History:")
        for entry in quote['negotiationLog']:
            log(f"    • {entry['sender']}: {entry['message']}")
            if entry.get('proposedDiscount'):
                log(f"      (Proposed: {entry['proposedDiscount']}%)")
    
    return quote

def sales_rep_respond(token, quote_id, message, counter_discount=None):
    """Sales rep responds to customer negotiation"""
    log(f"Sales rep responding to negotiation on quote {quote_id}...")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "comment": message,
        "proposedDiscount": counter_discount or 0
    }
    
    response = requests.post(
        f"{BASE_URL}/api/portal/quotes/{quote_id}/negotiate/respond",
        headers=headers,
        json=payload
    )
    
    if response.status_code != 200:
        log(f"❌ Failed to respond: {response.text}")
        return False
    
    result = response.json()
    log(f"✓ Response added to negotiation history")
    log(f"  - Quote Status: {result.get('status')}")
    return True

def main():
    print("\n" + "="*60)
    print("CUSTOMER NEGOTIATION FEATURE TEST")
    print("="*60)
    
    # Step 1: Customer login
    customer_token = login(CUSTOMER_CREDS)
    if not customer_token:
        return
    
    # Step 2: Get customer quotations
    quotes = get_customer_quotes(customer_token)
    if not quotes:
        log("⚠️  No quotations found. Cannot proceed with test.")
        return
    
    # Use first "Sent" status quote for testing
    test_quote = None
    for q in quotes:
        if q['status'] in ['Sent', 'Under Negotiation']:
            test_quote = q
            break
    
    if not test_quote:
        log(f"⚠️  No suitable quote found (need 'Sent' or 'Under Negotiation' status)")
        return
    
    log(f"\n📝 Using quote {test_quote['id']} for testing")
    
    # Step 3: Customer proposes discount
    propose_discount(customer_token, test_quote['id'], 15, "Please consider a 15% discount for bulk order")
    
    # Step 4: Check quote detail as customer (see negotiation)
    get_quote_detail(customer_token, test_quote['id'])
    
    # Step 5: Sales rep login
    sales_rep_token = login(SALES_REP_CREDS)
    if not sales_rep_token:
        return
    
    # Step 6: Sales rep checks quote detail (see customer negotiation)
    log("\n--- SALES REP VIEW ---")
    get_quote_detail(sales_rep_token, test_quote['id'])
    
    # Step 7: Sales rep responds
    sales_rep_respond(
        sales_rep_token,
        test_quote['id'],
        "Thank you for your interest. We can offer 12% discount for this order.",
        counter_discount=12
    )
    
    # Step 8: Customer refreshes to see response
    log("\n--- CUSTOMER FINAL VIEW ---")
    get_quote_detail(customer_token, test_quote['id'])
    
    print("\n" + "="*60)
    print("✓ TEST COMPLETE")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
