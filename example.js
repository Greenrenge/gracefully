process.env.ROARR_LOG = true
process.env.KUBERNETES_SERVICE_HOST = true
const app = require("express")()
const { create } = require("./index")
const { createReadiness } = create({})
const [one, two, three, four, five] = createReadiness(5)


app.get("/:id", (req, res) => {
  const id = req.params.id
  const mapping = { "1": one, "2": two, "3": three, "4": four, "5": five }
  if (mapping[id]) mapping[id]()
  res.status(200).send(id)
})

app.post("/:id", (req, res) => {
  const id = req.params.id
  const mapping = { "1": one, "2": two, "3": three, "4": four, "5": five }
  if (mapping[id]) mapping[id].toNotReady()
  res.status(200).send(id)
})

app.listen(4040)

