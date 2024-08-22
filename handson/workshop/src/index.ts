import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { client } from './db'

const app = new Hono()

app.get('/', (c) => {
  return c.json({message: 'hello'})
})

app.get('/users', async (c) => {
  const result = await client.query('select now()')

  return c.json({now: result.rows[0].now})
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
