import client from './client.js'

export const notesApi = {
  list: () => client.get('/notes'),
  create: (data) => client.post('/notes', data),
  update: (id, data) => client.put(`/notes/${id}`, data),
  remove: (id) => client.delete(`/notes/${id}`)
}
