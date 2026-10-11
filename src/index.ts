import { app } from '@/app.js'
import { config } from '@/config/index.js'

app.listen(config.port, () => {
  console.log(`${config.serviceName} écoute sur http://localhost:${config.port}`)
})
