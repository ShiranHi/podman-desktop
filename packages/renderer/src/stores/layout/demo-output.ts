export function demoOutput(name: string, view: string): string {
  if (view === 'terminal' || view === 'tty')
    return `$ pwd
/app
$ ls
package.json  server.js  public
$ printenv NODE_ENV
production
`;
  if (view === 'kube')
    return `apiVersion: v1
kind: Pod
metadata:
  name: demo-workload
spec:
  containers:
    - name: web
      image: quay.io/demo/web-frontend:v2
      ports:
        - containerPort: 3000
`;
  if (view === 'history')
    return `Image history — ${name}
LAYER     COMMAND                     SIZE
3         CMD ["node", "server.js"]    0 B
2         COPY ./app /app             9 MB
1         FROM node:22                182 MB
`;
  return `Logs — ${name}
09:00:00 INFO  Starting web application
09:00:01 INFO  Configuration loaded
09:00:02 INFO  Listening on port 3000
09:00:10 INFO  GET /health 200 4ms
09:00:12 WARN  Upstream response delayed; retrying
09:00:13 INFO  Upstream retry succeeded
`;
}
