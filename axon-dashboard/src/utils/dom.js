export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') element.className = value;
    else if (key === 'innerHTML') element.innerHTML = value;
    else if (key === 'textContent') element.textContent = value;
    else if (key.startsWith('on')) element.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'dataset') Object.assign(element.dataset, value);
    else element.setAttribute(key, value);
  }
  for (const child of children) {
    if (typeof child === 'string') element.appendChild(document.createTextNode(child));
    else if (child instanceof Node) element.appendChild(child);
  }
  return element;
}

export function mount(container, ...elements) {
  if (typeof container === 'string') container = document.querySelector(container);
  container.innerHTML = '';
  elements.forEach(el => { if (el) container.appendChild(el); });
}

export function qs(selector) { return document.querySelector(selector); }
export function qsa(selector) { return document.querySelectorAll(selector); }
