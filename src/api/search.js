import client from './client.js'

export const searchApi = {
  query: (q) => client.get('/search', { params: { q } })
}
