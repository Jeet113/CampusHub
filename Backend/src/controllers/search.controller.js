import ApiResponse from '../utils/ApiResponse.js'
import { input } from '../utils/request.js'
import { globalSearch } from '../services/search.service.js'

export async function search(request, response) {
  return response.json(new ApiResponse(await globalSearch(input(request, 'query').q), 'Search results retrieved'))
}
