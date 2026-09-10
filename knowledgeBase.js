// A stand-in for a real retrieval system (vector DB / RAG pipeline).
// Swap searchKB() out for an embeddings-based lookup against your real
// help-center content when moving beyond the demo.

const KB = [
  {
    id: "returns-window",
    topic: "return policy window",
    keywords: ["return", "returns", "policy", "window", "days"],
    answer:
      "Items can be returned within 30 days of delivery if unused and in original packaging. Worn footwear and used camp stoves are final sale.",
  },
  {
    id: "refund-timing",
    topic: "refund processing time",
    keywords: ["refund", "money back", "how long", "processing"],
    answer:
      "Approved refunds are issued to the original payment method and typically post within 5-7 business days.",
  },
  {
    id: "shipping-times",
    topic: "shipping times",
    keywords: ["shipping", "ship", "delivery time", "how long", "arrive"],
    answer:
      "Standard shipping takes 4-6 business days within the continental US. Expedited (2-day) shipping is available at checkout for an added fee.",
  },
  {
    id: "damaged-item",
    topic: "damaged or defective items",
    keywords: ["damaged", "broken", "defective", "wrong item"],
    answer:
      "If an item arrives damaged or wrong, keep the packaging and photos on hand; support can issue a free replacement or refund in most cases without requiring a return shipment.",
  },
  {
    id: "warranty",
    topic: "product warranty",
    keywords: ["warranty", "guarantee", "lifetime"],
    answer:
      "Hard goods (packs, tents, bottles) carry a 2-year manufacturer warranty against defects. Soft goods worn through normal use are not covered.",
  },
  {
    id: "gift-cards",
    topic: "gift cards",
    keywords: ["gift card", "gift certificate"],
    answer:
      "Gift cards never expire and can be combined with one other payment method at checkout. They cannot be redeemed for cash.",
  },
];

function searchKB(query) {
  const q = (query || "").toLowerCase();
  const scored = KB.map((entry) => {
    let score = 0;
    entry.keywords.forEach((k) => {
      if (q.includes(k)) score += 2;
    });
    if (q.includes(entry.topic)) score += 3;
    return { entry, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { found: false, message: "No matching help center article found for that query." };
  }

  return {
    found: true,
    results: scored.slice(0, 2).map((s) => ({ topic: s.entry.topic, answer: s.entry.answer })),
  };
}

module.exports = { searchKB, KB };
