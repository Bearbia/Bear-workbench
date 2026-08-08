import client from './client.js'

export const todosApi = {
  list: (params) => client.get('/todos', { params }),
  create: (data) => client.post('/todos', data),
  update: (id, data) => client.put(`/todos/${id}`, data),
  remove: (id) => client.delete(`/todos/${id}`)
}
