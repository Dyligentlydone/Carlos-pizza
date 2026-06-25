# Retell Agent Readiness Notes

This document answers the three pre-build questions from the Retell team.

## 1. Order Lookup API

- **Endpoint:** `GET https://pizzashopdemo.up.railway.app/api/orders/lookup`
- **Query parameters:**
  - `phone` (optional) – any format; digits are normalized internally.
  - `order_id` (optional) – Supabase order UUID returned by `place_order`.
  - At least one of the parameters is required.
- **Returns:**
  ```jsonc
  {
    "success": true,
    "lookup": {
      "order_id": null,
      "phone": "6168219153",
      "matches": 1
    },
    "orders": [
      {
        "id": "8fb3…",
        "status": "in_kitchen",
        "customer_name": "Dylan",
        "phone": "616-821-9153",
        "order_type": "delivery",
        "subtotal": 32.99,
        "total": 32.99,
        "items": [ { "name": "16\" Margherita", "quantity": 1, … } ],
        "address": "6931 Ramsdell Dr NE, Rockford, MI 49341",
        "notes": null,
        "created_at": "2026-06-11T14:19:44.237Z",
        "estimated_ready": "2026-06-11T15:04:44.237Z"
      }
    ]
  }
  ```
- **Usage guidance:**
  - When callers ask “Where’s my order?” pass the phone number they used when ordering.
  - When callers provide an order number (the UUID returned by `place_order`), send it via `order_id`.
  - The endpoint returns recent matches (latest first) plus a basic ETA (`estimated_ready`). If no orders are found, `orders` will be an empty array.

## 2. FAQ / Knowledge Base Content

Agent answers should pull from the following facts (source: bigopizzagr.com, June 2026):

| Topic | Answer |
| --- | --- |
| **Store name** | Big O Pizza & Booze (Downtown Grand Rapids) |
| **Address** | 80 Ottawa Ave NW #1, Grand Rapids, MI 49503 |
| **Phone** | 616-451-1887 |
| **Hours** | Mon–Tue: Closed · Wed–Thu: 4 PM – 10 PM · Fri–Sat: 4 PM – 11:30 PM · Sun: 4 PM – 9:30 PM |
| **Order types** | Pickup or delivery (via in-house drivers within central Grand Rapids) |
| **Delivery area** | Roughly a 4‑mile radius around 80 Ottawa Ave NW. Requests outside that zone should be politely declined or transferred. |
| **Menu scope** | Specialty pizzas (Margherita, BBQ Chicken, Meat Lover’s, Supreme, Chicken Pesto, Pepperoni), build-your-own pies, cheesy breadsticks, salads, wings, and dipping sauces. Alcohol is dine-in only. |
| **Cooking time** | 20–25 minutes for pickup, 35–45 minutes for delivery depending on volume. |
| **Payments** | Major credit/debit cards; cash accepted for pickup and delivery upon request. |
| **Allergies** | Pesto contains pine nuts; dough contains gluten; shared kitchen means cross-contact is possible. Encourage guests to call the shop for severe allergies. |
| **Catering** | Not currently offered. |
| **Refunds / order issues** | Minor errors (missing dipping sauce, etc.) can be credited or remade; larger complaints should be escalated to the shift lead via human handoff (see below). |

These responses can be pasted into Retell’s knowledge base so the agent can answer common questions without handoff.

## 3. Human Handoff Plan

- **When to escalate:**
  - Customer insists on speaking with a person.
  - Complaints about delivery drivers, payment issues, refunds that the agent can’t authorize.
  - Requests outside the delivery zone that need manager approval.
- **Contact:** call the shop directly at **616-451-1887**.
- **Live support hours:** same as operating hours (Wed–Sun evenings). Outside those hours, the agent should apologize and promise a call-back during the next service window.
- **Script guidance:**
  1. Collect the caller’s name, callback number, and a one-sentence summary of the issue.
  2. Tell the customer you’re connecting them to the on-duty manager at 616-451-1887.
  3. If the transfer fails after two attempts, log the issue in Supabase (TODO) and reassure the caller that staff will reach out.

> **Next steps:** Once Retell confirms the agent spec, we can wire this handoff logic into the agent workflow (e.g., via Twilio warm transfer or a call-out to the shop line).
