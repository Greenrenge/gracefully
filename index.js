process.env.KUBERNETES_SERVICE_HOST = true
const { createLightship } = require("lightship")

const create = (
  { detectKubernetes, port, signals, terminate, gracefulShutdownTimeout } = {
    port: 13000,
  },
) => {
  const lightship = createLightship({
    ...(detectKubernetes && { detectKubernetes }),
    ...(port && { port }),
    ...(signals && { signals }),
    ...(terminate && { terminate }),
    ...(gracefulShutdownTimeout && { gracefulShutdownTimeout }),
  })
  return {
    lightship,
    createReadiness: (n = 1) => {
      const createDeduct = () => {
        let isReady = false
        const toNotReady = () => {
          if (isReady) {
            isReady = false
            n = n + 1
            lightship.signalNotReady()
          }
        }
        const toReady = () => {
          if (!isReady) {
            isReady = true
            n = n - 1
            if (n <= 0) {
              lightship.signalReady()
            }
          }
        }
        return [toReady, toNotReady]
      }

      return Array.from(Array(+n), () => {
        const [toReady, toNotReady] = createDeduct()
        const apiFn = () => {
          toReady()
          return toNotReady
        }
        apiFn.toNotReady = toNotReady
        return apiFn
      })
    },
  }
}
module.exports = {
  create,
}
