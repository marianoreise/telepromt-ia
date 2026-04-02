/**
 * Singleton para pasar un MediaStream entre el wizard de creación y
 * la página de sesión activa, dentro de la misma navegación cliente.
 */
let _stream: MediaStream | null = null

export function setSharedStream(s: MediaStream) {
  _stream = s
}

/** Consume el stream (lo elimina del singleton al leerlo). */
export function consumeSharedStream(): MediaStream | null {
  const s = _stream
  _stream = null
  return s
}
