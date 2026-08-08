import client from './client.js'

export const focusApi = {
  list: (params) => client.get('/focus', { params }),
  stats: () => client.get('/focus/stats'),
  create: (data) => client.post('/focus', data),
  remove: (id) => client.delete(`/focus/${id}`)
}
