/* The React site uses the base site's images/ folder directly, so there is
   only one copy of each picture. Vite finds them all here at build time.

   Use it like:  <img src={img('hero-image.jpg')} />                        */
const files = import.meta.glob('../../../images/*', { eager: true, query: '?url', import: 'default' })

export function img(name) {
  return files['../../../images/' + name]
}
