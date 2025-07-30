/* eslint-disable no-unused-expressions */
import request from "supertest"
import isArray from "lodash/isArray"
import * as chai from "chai"
import createLightship from "../src/index.js"
import { Lightship } from "lightship"

const { should } = chai
describe("createLightship", () => {
  describe("#Default Configuration", () => {
    let server: Lightship["server"]

    beforeEach(async () => {
      const customLightShip = await createLightship()
      server = customLightShip.lightship.server
    })
    afterEach(done => {
      server?.close(done)
    })

    it("should start server at default port 13000 even when in local mode", () => {
      const addr = server?.address?.()
      if (addr && typeof addr === "object" && "port" in addr) {
        addr.port.should.be.equal(13000)
      } else {
        throw new Error("Server address is not an object with port property")
      }
    })
    describe("#Liveness", () => {
      it("should expose path /live with return status code 200", () =>
        request(server)
          .get("/live")
          .send()
          .expect(200))
    })

    describe("#Readiness", () => {
      it("should expose path /ready with default to return status code 500", () =>
        request(server)
          .get("/ready")
          .send()
          .expect(500))
    })
  })
  describe("#Options", () => {
    afterEach(() => {
      delete process.env.ROARR_LOG
      delete process.env.KUBERNETES_SERVICE_HOST
      delete process.env.NODE_ENV
      delete process.env.LIGHTSHIP_RANDOM_PORT
    })
    describe("#enableLog option", () => {
      it("should set process.env.ROARR_LOG to true", async () => {
        const { lightship } = await createLightship({ enableLog: true })
        lightship.server.close()
        process.env.ROARR_LOG?.should.equal("true")
      })
    })

    describe("#randomPortOnLocal LIGHTSHIP_RANDOM_PORT=true and NODE_ENV=test option", () => {
      it("should set process.env.KUBERNETES_SERVICE_HOST when randomPortOnLocal is not set and run on local", async () => {
        const { lightship } = await createLightship()
        await new Promise<void>(resolve => {
          lightship.server.close(() => resolve())
        })
        process.env.KUBERNETES_SERVICE_HOST?.should.not.be.undefined
      })

      it("should random port on local if randomPortOnLocal is set to true", async () => {
        const { lightship } = await createLightship({
          port: 12000,
          randomPortOnLocal: true,
        })
        const address = lightship.server.address()
        if (address && typeof address === "object" && "port" in address) {
          address.port.should.not.equal(12000)
        }
        await new Promise<void>(resolve => {
          lightship.server.close(() => resolve())
        })
        should().equal(process.env.KUBERNETES_SERVICE_HOST, undefined)
      })

      it("should not interfere to KUBERNETES_SERVICE_HOST environment value if it's running in k8s cluster", async () => {
        process.env.KUBERNETES_SERVICE_HOST = "cluster-value"
        const { lightship } = await createLightship({
          port: 12000,
          randomPortOnLocal: true,
        })
        const address = lightship.server.address()
        if (address && typeof address === "object" && "port" in address) {
          address.port.should.equal(12000)
        } else {
          throw new Error("Server address is not an object with port property")
        }
        await new Promise<void>(resolve => {
          lightship.server.close(() => resolve())
        })
        process.env.KUBERNETES_SERVICE_HOST?.should.equal("cluster-value")
      })

      it("should be able to call handler without error", async () => {
        const { lightship } = await createLightship({ port: 12300 })
        await new Promise<void>(resolve => {
          console.log("Closing server...")
          lightship.server.close(() => resolve())
        })
        const { lightship: lightship2 } = await createLightship({ port: 12300 })
        await new Promise<void>(resolve => {
          console.log("Closing server...")
          lightship2.server.close(() => resolve())
        })
      })

      it("should random port if process.env.LIGHTSHIP_RANDOM_PORT=true", async () => {
        process.env.LIGHTSHIP_RANDOM_PORT = "not-true"
        const { lightship } = await createLightship({ port: 12300 })
        const address = lightship.server.address()
        if (address && typeof address === "object" && "port" in address) {
          address.port.should.equal(12300)
        }
        await new Promise<void>(resolve => {
          lightship.server.close(() => resolve())
        })

        process.env.LIGHTSHIP_RANDOM_PORT = "true"
        const { lightship: lightship2 } = await createLightship({ port: 13100 })
        const address2 = lightship2.server.address()
        if (address2 && typeof address2 === "object" && "port" in address2) {
          address2.port.should.not.equal(13100)
        }
        await new Promise<void>(resolve => {
          lightship2.server.close(() => resolve())
        })

        process.env.LIGHTSHIP_RANDOM_PORT = "true"
        const { lightship: lightship3 } = await createLightship({ port: 13200 })
        const address3 = lightship3.server.address()
        if (address3 && typeof address3 === "object" && "port" in address3) {
          address3.port.should.not.equal(13200)
        }
        await new Promise<void>(resolve => {
          lightship3.server.close(() => resolve())
        })
      })

      it("should random port if process.env.LIGHTSHIP_RANDOM_PORT=true even when service is running on k8s", async () => {
        process.env.LIGHTSHIP_RANDOM_PORT = "true"
        process.env.KUBERNETES_SERVICE_HOST = "cluster-value"
        const { lightship } = await createLightship({ port: 12000 })
        const address = lightship.server.address()
        if (address && typeof address === "object" && "port" in address) {
          address.port.should.not.equal(12000)
        }
        await new Promise<void>(resolve => {
          lightship.server.close(() => resolve())
        })
        process.env.KUBERNETES_SERVICE_HOST?.should.equal("cluster-value")
      })
    })
  })

  describe("#CreateReadiness", () => {
    let server: any
    let createReadiness: any
    const serverMustReady = (s: any) =>
      request(s)
        .get("/ready")
        .send()
        .expect(200)
    const serverMustNotReady = (s: any) =>
      request(s)
        .get("/ready")
        .send()
        .expect(500)
    beforeEach(async () => {
      const customLightShip = await createLightship()
      server = customLightShip.lightship.server
      createReadiness = customLightShip.createReadiness
    })
    afterEach(async () => {
      await new Promise<void>(resolve => {
        server.close(() => resolve())
      })
    })
    describe("#Behavior", () => {
      it("should return Array<Function> type, default to length 1", () => {
        const returnVal = createReadiness()
        isArray(returnVal).should.equal(true)
        returnVal.should.have.property("length").which.equal(1)
      })
      it("should make lightship to be ready state when the returned function is called", async () => {
        await serverMustNotReady(server)
        const [toReady] = createReadiness()
        toReady()
        await serverMustReady(server)
      })
      it("should make lightship to be ready state when the returned function is called more than 1 time", async () => {
        await serverMustNotReady(server)
        const [toReady] = createReadiness()
        toReady()
        toReady()
        await serverMustReady(server)
      })
      it("should make lightship back to unready state when a result return from the returned function is called", async () => {
        await serverMustNotReady(server)
        const [toReady] = createReadiness()
        const toNotReady = toReady()
        await serverMustReady(server)
        toNotReady()
        await serverMustNotReady(server)
      })
      it("should make lightship back to unready state when a result return from the returned function is called more than 1 time", async () => {
        await serverMustNotReady(server)
        const [toReady] = createReadiness()
        const toNotReady = toReady()
        await serverMustReady(server)
        toNotReady()
        toNotReady()
        await serverMustNotReady(server)
      })
      it("should make lightship to ready again if the ready function is called", async () => {
        await serverMustNotReady(server)
        const [toReady] = createReadiness()
        const toNotReady = toReady()
        await serverMustReady(server)
        toNotReady()
        await serverMustNotReady(server)
        toReady()
        await serverMustReady(server)
      })
      it("should make lightship back to unready state when a nested property 'toNotReady' of returned function is called", async () => {
        await serverMustNotReady(server)
        const [toReady] = createReadiness()
        const { toNotReady } = toReady
        toReady()
        await serverMustReady(server)
        toNotReady()
        await serverMustNotReady(server)
      })
    })
    describe("#Multiple Readiness Handlers", () => {
      it("should return Array<Function> type which has length matching to the parameter sent", async () => {
        const returnVal = createReadiness(3)
        isArray(returnVal).should.equal(true)
        returnVal.should.have.property("length").which.equal(3)
      })
      it("should have tolerance to multiple calls by only first time called is actually made", async () => {
        const returnVal = createReadiness(3)
        isArray(returnVal).should.equal(true)
        returnVal.should.have.property("length").which.equal(3)
        const returnVal2 = createReadiness(10)
        isArray(returnVal2).should.equal(true)
        returnVal2.should.have.property("length").which.equal(3)
        returnVal.push(() => "this-is-mutation")
        const [, , , newFn] = returnVal2
        newFn().should.equal("this-is-mutation")
      })
      it("should make lightship to be ready state when every returned function is called", async () => {
        await serverMustNotReady(server)
        const [dbReady, expressReady, senecaReady] = createReadiness(3)
        dbReady()
        expressReady()
        senecaReady()
        await serverMustReady(server)
      })
      it("should not make lightship to be ready state when there is some returned function is not called", async () => {
        await serverMustNotReady(server)
        const [dbReady, expressReady] = createReadiness(3)
        dbReady()
        expressReady()
        await serverMustNotReady(server)
      })
      it("should not make lightship to be ready state when there is some returned function is not called even when the other functions are called multiple times", async () => {
        await serverMustNotReady(server)
        const [dbReady, expressReady] = createReadiness(3)
        dbReady()
        dbReady()
        expressReady()
        expressReady()
        expressReady()
        await serverMustNotReady(server)
      })
      it("should make lightship back to unready state after one of the toNotReady function is called", async () => {
        await serverMustNotReady(server)
        const [dbReady, expressReady, senecaReady] = createReadiness(3)
        dbReady()
        expressReady()
        senecaReady()
        await serverMustReady(server)
        expressReady.toNotReady()
        await serverMustNotReady(server)
      })
      it("should make lightship back to ready state after be unready correctly by multiple toNotReady handlers calling", async () => {
        await serverMustNotReady(server)
        const [dbReady, expressReady, senecaReady] = createReadiness(3)
        dbReady()
        expressReady()
        senecaReady()
        await serverMustReady(server)
        expressReady.toNotReady()
        await serverMustNotReady(server)
        dbReady.toNotReady()
        await serverMustNotReady(server)
        expressReady()
        expressReady()
        await serverMustNotReady(server)
        dbReady()
        await serverMustReady(server)
      })
    })
  })
})
