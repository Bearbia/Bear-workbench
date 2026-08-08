import client from './client.js'

export const statsApi = {
  get: () => client.get('/stats')
}
