/* The server checks forms with the SAME rules as the browser, by loading
   the base site's js/validators.js. That file was written for browsers and
   puts its rules on `window`, so we point `window` at Node's global first. */
globalThis.window = globalThis
await import('../../../js/validators.js')

export default globalThis.Validators
