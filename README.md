```
    spec:
      terminationGracePeriodSeconds: 60
      containers:
        - name: default-http-backend
          image: gcr.io/google_containers/defaultbackend:1.0
          livenessProbe:
            # exec:
            #   command:
            #     - cat
            #     - /tmp/healthy # return non-zero exit code --> restart
            # or
            # tcpSocket:
            #   port: 80
            httpGet:
              path: /healthz
              port: 8080
              scheme: HTTP
            initialDelaySeconds: 30 # sec to wait until it lives, if 30sec passed but not alive then restart, else try the first probe
            periodSeconds: 5 # check every 5 sec
            timeoutSeconds: 5 # timeout for http req
            successThreshold: 1
            failureThreshold: 1
      terminationGracePeriodSeconds : 30
```

startUpProbe # failureThreshold\*periodSeconds long enough to worse case startup time

livenessProbe
[200, 300] okay
4xx,5xx , pod is restarted

readiness

- external startup

rule

1. independent function
2. must stay in the same main thread of the app
3. livenessProbe must have no logic [200 ok][500 fail], logic is what check interconnected services. but it can throws error when state go to zombie.
4. any logic in readiness must complete answer about readiness of the app
   clarify what ready really mean for the app, must run all steps that determine that the app is ready to receive and to process request.
   eg. database connection is established and ready to be used.
   any logic in readiness must complete answer about readiness of the app
5. ready logic is not responsible to recover anything.

https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/

initialDelaySeconds: Number of seconds after the container has started before liveness or readiness probes are initiated. Defaults to 0 seconds. Minimum value is 0.
periodSeconds: How often (in seconds) to perform the probe. Default to 10 seconds. Minimum value is 1.
timeoutSeconds: Number of seconds after which the probe times out. Defaults to 1 second. Minimum value is 1.
successThreshold: Minimum consecutive successes for the probe to be considered successful after having failed. Defaults to 1. Must be 1 for liveness. Minimum value is 1.
failureThreshold: When a Pod starts and the probe fails, Kubernetes will try failureThreshold times before giving up. Giving up in case of liveness probe means restarting the container. In case of readiness probe the Pod will be marked Unready. Defaults to 3. Minimum value is 1.

lightship
https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html
https://github.com/gajus/lightship#lightship-usage-kubernetes-container-probe-configuration

# k8s graceful

https://cloud.google.com/blog/products/gcp/kubernetes-best-practices-terminating-with-grace
https://freecontent.manning.com/handling-client-requests-properly-with-kubernetes/
https://pracucci.com/graceful-shutdown-of-kubernetes-pods.html

# mongodb may use preStop hook to stop mongod service

express+mongoose
https://hackernoon.com/graceful-shutdown-in-nodejs-2f8f59d1c357
