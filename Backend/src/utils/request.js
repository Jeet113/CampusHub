export function input(request, section) {
  return request.validated?.[section] ?? request[section] ?? {}
}
