export function requireElement(id) {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing required UI element: ${id}`);
  }
  return element;
}
