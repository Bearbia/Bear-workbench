import client from './client.js'

export const linksApi = {
  list: () => client.get('/links'),
  create: (data) => client.post('/links', data),
  update: (id, data) => client.put(`/links/${id}`, data),
  remove: (id) => client.delete(`/links/${id}`)
}
