const defaultHeaders = { 'Content-Type': 'application/json' }

export async function getJson(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...defaultHeaders, ...(options.headers || {}) } })
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`)
  return res.json()
}

export async function postJson(url, body, options = {}) {
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
  })
  if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`)
  return res.json()
}


