import api from './api.js'

export const fetchActiveOffers = async () => {
  const { data } = await api.get('/offers/active')
  return data.offers
}
