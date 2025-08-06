// eslint-disable-next-line import/no-extraneous-dependencies
import express from "express"
import { createLightship } from "../src/index.js"

const app = express()

process.env.ROARR_LOG = true
process.env.KUBERNETES_SERVICE_HOST = true

async function main() {
  const { createReadiness } = await createLightship({ port: 13000 })
  const [one, two, three, four, five] = createReadiness(5)

  app.get("/:id", (req, res) => {
    const {
      params: { id },
    } = req
    const mapping = { 1: one, 2: two, 3: three, 4: four, 5: five }
    if (mapping[id]) mapping[id]()
    res.status(200).send(id)
  })

  app.post("/:id", (req, res) => {
    const {
      params: { id },
    } = req
    const mapping = { 1: one, 2: two, 3: three, 4: four, 5: five }
    if (mapping[id]) mapping[id].toNotReady()
    res.status(200).send(id)
  })

  app.listen(3000)
}
main().finally(() => {
  // eslint-disable-next-line no-console
  console.log("Server is running on port 3000")
})
export default app
