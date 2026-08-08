import client from './client.js'

export const habitsApi = {
  list: () => client.get('/habits'),
  create: (data) => client.post('/habits', data),
  update: (id, data) => client.put(`/habits/${id}`, data),
  remove: (id) => client.delete(`/habits/${id}`),
  toggle: (id, date) => client.post(`/habits/${id}/toggle`, { date })
}
