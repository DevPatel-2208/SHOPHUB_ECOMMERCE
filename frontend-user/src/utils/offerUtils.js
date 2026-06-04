export const getOfferLabel = (offer) => {
  if (!offer) return ''
  if (offer.discountType === 'percentage') return `${offer.discountValue}% OFF`
  if (offer.discountType === 'fixed' || offer.discountType === 'flat') return `₹${offer.discountValue} OFF`
  return offer.title || 'OFFER'
}

export const getDiscountText = (offer) => {
  if (!offer) return ''
  if (offer.discountType === 'percentage') return `UP TO ${offer.discountValue}% OFF`
  if (offer.discountType === 'fixed') return `FLAT ₹${offer.discountValue} OFF`
  if (offer.discountType === 'flat') return `₹${offer.discountValue} OFF`
  return offer.title || ''
}

export const getOfferTag = (offer) => {
  if (!offer) return ''
  if (offer.discountType === 'percentage') return `${offer.discountValue}% off`
  if (offer.discountType === 'fixed') return `₹${offer.discountValue} off`
  if (offer.discountType === 'flat') return `Flat ₹${offer.discountValue}`
  return offer.title || ''
}

export const calculateDiscount = (price, offer) => {
  if (!offer || !price) return { discountAmount: 0, discountedPrice: price }
  let discountAmount = 0
  if (offer.discountType === 'percentage') {
    discountAmount = (price * offer.discountValue) / 100
    if (offer.maxDiscount) discountAmount = Math.min(discountAmount, offer.maxDiscount)
  } else if (offer.discountType === 'flat' || offer.discountType === 'fixed') {
    discountAmount = offer.discountValue
  }
  discountAmount = Math.round(discountAmount * 100) / 100
  const discountedPrice = Math.max(0, Math.round((price - discountAmount) * 100) / 100)
  return { discountAmount, discountedPrice }
}

export const comparePriceDiscount = (comparePrice, price) => {
  if (!comparePrice || !price || comparePrice <= price) return 0
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

export const formatCurrency = (amount) => {
  return Number(amount || 0).toLocaleString('en-IN')
}
