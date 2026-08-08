import client from './client.js'

export const eventsApi = {
  list: (params) => client.get('/events', { params }),
  create: (data) => client.post('/events', data),
  update: (id, data) => client.put(`/events/${id}`, data),
  remove: (id) => client.delete(`/events/${id}`)
}
