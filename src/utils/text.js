const MOJIBAKE_REPLACEMENTS = [
  ['ÃƒÂ¡', 'á'], ['ÃƒÂ©', 'é'], ['ÃƒÂ­', 'í'], ['ÃƒÂ³', 'ó'], ['ÃƒÂº', 'ú'],
  ['ÃƒÂ', 'Á'], ['ÃƒÂ‰', 'É'], ['ÃƒÂ', 'Í'], ['Ãƒâ€œ', 'Ó'], ['ÃƒÅ¡', 'Ú'],
  ['ÃƒÂ±', 'ñ'], ['Ãƒâ€˜', 'Ñ'],
  ['Ã¡', 'á'], ['Ã©', 'é'], ['Ã­', 'í'], ['Ã³', 'ó'], ['Ãº', 'ú'],
  ['Ã', 'Á'], ['Ã‰', 'É'], ['Ã', 'Í'], ['Ã“', 'Ó'], ['Ãš', 'Ú'],
  ['Ã±', 'ñ'], ['Ã‘', 'Ñ'],
  ['Â¿', '¿'], ['Â¡', '¡'], ['Â°', '°'], ['Âº', 'º'], ['Âª', 'ª'],
  ['Â·', '·'], ['Â«', '«'], ['Â»', '»'],
  ['â€“', '–'], ['â€”', '—'], ['â€¦', '…'], ['â€¢', '•'],
  ['â€œ', '“'], ['â€', '”'], ['â€˜', '‘'], ['â€™', '’'],
  ['â‚¬', '€'], ['Ã—', '×'],
]

const MAYBE_MOJIBAKE_REGEX = /(Ã|Â|â€“|â€”|â€¦|â€¢|â€œ|â€|â€˜|â€™)/

export function fixMojibake(value) {
  if (typeof value !== 'string' || !value) return value
  if (!MAYBE_MOJIBAKE_REGEX.test(value)) return value

  let out = value
  for (let i = 0; i < 3; i += 1) {
    const prev = out
    for (const [bad, good] of MOJIBAKE_REPLACEMENTS) {
      out = out.split(bad).join(good)
    }
    if (out === prev) break
  }
  return out
}

export function normalizeTextPayload(value) {
  if (typeof value === 'string') return fixMojibake(value)
  if (Array.isArray(value)) return value.map(normalizeTextPayload)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalizeTextPayload(v)]),
    )
  }
  return value
}
