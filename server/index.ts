import { createApp } from './app.ts'

const port = Number(process.env.PORT || 4174)
const serveStatic = process.env.NODE_ENV === 'production'

createApp({ serveStatic }).listen(port, () => {
  console.log(`Resume Studio API listening on http://localhost:${port}`)
})
