FROM node:22-alpine
WORKDIR /app
EXPOSE 3000
# node_modules are installed at runtime into the named volume via CMD,
# so they aren't shadowed by the bind mount.
CMD ["sh", "-c", "npm install && npm run dev"]
