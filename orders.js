// Stand-in for a real order-management / CRM system.
// Replace getOrderStatus() and processRefund() with real API calls
// (e.g. to Shopify, an internal order service, a payments provider) in production.

const ORDERS = {
  "BC-1042": {
    customer: "J. Alvarez",
    item: "Cairn 40L Backpack",
    status: "shipped",
    carrier: "UPS",
    tracking: "1Z999AA10123456784",
    eta: "Sep 12",
    total: "$189.00",
    refundEligible: true,
  },
  "BC-2207": {
    customer: "R. Osei",
    item: "Trail 2-Person Tent",
    status: "delivered",
    carrier: "FedEx",
    tracking: "784561239087",
    eta: "delivered Sep 3",
    total: "$342.50",
    refundEligible: true,
  },
  "BC-3390": {
    customer: "M. Chen",
    item: "Insulated Steel Bottle x2",
    status: "processing",
    carrier: null,
    tracking: null,
    eta: "ships Sep 10",
    total: "$54.00",
    refundEligible: false,
  },
};

function getOrderStatus(orderId) {
  const id = (orderId || "").toUpperCase();
  const o = ORDERS[id];
  if (!o) {
    return { found: false, message: `No order found with ID ${id}. Order IDs look like BC-1042.` };
  }
  return { found: true, order_id: id, ...o };
}

function processRefund(orderId, reason) {
  const id = (orderId || "").toUpperCase();
  const o = ORDERS[id];
  if (!o) {
    return { success: false, message: `No order found with ID ${id}.` };
  }
  if (!o.refundEligible) {
    return {
      success: false,
      message: `Order ${id} (${o.item}) is not currently eligible for refund — it hasn't shipped yet or is outside the return window.`,
    };
  }
  return {
    success: true,
    message: `Refund of ${o.total} initiated for order ${id} (${o.item}). Reason logged: "${reason}". Funds will post in 5-7 business days.`,
  };
}

module.exports = { getOrderStatus, processRefund, ORDERS };
