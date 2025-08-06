import { createLightship as createLightShipInstance } from "lightship"
import type { Lightship } from "lightship"
export type * from "lightship"

const DEFAULT_PORT = 13000

export interface CreateOptions {
  detectKubernetes?: boolean
  port?: number
  signals?: string[]
  terminate?: () => Promise<void>
  gracefulShutdownTimeout?: number
  enableLog?: boolean
  randomPortOnLocal?: boolean
}

export interface ReadinessHandler {
  (): () => void
  toNotReady: () => void
}

export interface LightshipWrapper {
  lightship: Lightship
  createReadiness: (number?: number) => ReadinessHandler[]
}

const create = async (
  {
    detectKubernetes,
    port: customPort = DEFAULT_PORT,
    signals,
    terminate,
    gracefulShutdownTimeout,
    enableLog,
    randomPortOnLocal,
  }: CreateOptions = { port: DEFAULT_PORT },
): Promise<LightshipWrapper> => {
  if (enableLog) process.env.ROARR_LOG = "true"
  const isOnLocal = !process.env.KUBERNETES_SERVICE_HOST

  if (isOnLocal && !randomPortOnLocal) {
    // mock k8s env to force lightship use config port
    process.env.KUBERNETES_SERVICE_HOST = "kubernetes.default.svc.cluster.local"
  }
  const isTestENV = process.env.NODE_ENV === "test"
  const randomPort = process.env.LIGHTSHIP_RANDOM_PORT === "true" || isTestENV
  const port = randomPort ? 0 : customPort // random port

  const lightship = await createLightShipInstance({
    ...(detectKubernetes && { detectKubernetes }),
    ...(port && { port }),
    ...(signals && { signals }),
    ...(terminate && { terminate }),
    ...(gracefulShutdownTimeout && { gracefulShutdownTimeout }),
  })

  if (isTestENV) lightship.server.close()

  let createdReadiness: ReadinessHandler[] | undefined
  const wrapLightship = {
    lightship,
    createReadiness: (number = 1) => {
      if (createdReadiness) return createdReadiness
      let n = number
      const createDeduct = () => {
        let isReady = false

        const toNotReady = () => {
          if (isReady) {
            isReady = false
            n += 1
            lightship.signalNotReady()
          }
        }

        const toReady = () => {
          if (!isReady) {
            isReady = true
            n -= 1
            if (n <= 0) {
              lightship.signalReady()
            }
          }
        }

        return [toReady, toNotReady]
      }

      createdReadiness = Array.from(Array(+n), () => {
        const [toReady, toNotReady] = createDeduct()
        const fnName = () => {
          toReady()
          return toNotReady
        }
        fnName.toNotReady = toNotReady
        return fnName
      })
      return createdReadiness
    },
  }

  return wrapLightship
}

export const createLightship = create

export default create
