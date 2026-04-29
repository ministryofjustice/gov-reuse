
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gov-reuse
  namespace: ${NAMSPACE}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gov-reuse
  template:
    metadata:
      labels:
        app: gov-reuse
    spec:
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: web
          image: ${REGISTRY}/${REPOSITORY}:${SHA}
          ports:
            - containerPort: 8080
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              cpu: "50m"
              memory: "64Mi"
            limits:
              cpu: "250m"
              memory: "128Mi"
          volumeMounts:
            - name: tmp
              mountPath: /tmp
          readinessProbe:
            httpGet:
              path: /
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
      volumes:
        - name: tmp
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: gov-reuse
  namespace: ${NAMSPACE}
spec:
  type: ClusterIP
  selector:
    app: gov-reuse
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: gov-reuse
  namespace: ${NAMSPACE}
  annotations:
    external-dns.alpha.kubernetes.io/aws-weight: "100"
    external-dns.alpha.kubernetes.io/set-identifier: "gov-reuse-${NAMSPACE}-green"
    cert-manager.io/cluster-issuer: letsencrypt-production
spec:
  ingressClassName: default
  tls:
    - hosts:
        - ${NAMSPACE}.apps.cloud-platform.service.justice.gov.uk
        - dev.reuselibrary.service.justice.gov.uk
      secretName: reuse-library-tls
  rules:
    - host: ${NAMSPACE}.apps.cloud-platform.service.justice.gov.uk
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: gov-reuse
                port:
                  number: 80
    - host: dev.reuselibrary.service.justice.gov.uk
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: gov-reuse
                port:
                  number: 80