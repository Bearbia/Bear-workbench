import client from './client.js'

export const journalsApi = {
  list: (params) => client.get('/journals', { params }),
  get: (id) => client.get(`/journals/${id}`),
  upsert: (data) => client.post('/journals', data),
  update: (id, data) => client.put(`/journals/${id}`, data),
  remove: (id) => client.delete(`/journals/${id}`)
}
