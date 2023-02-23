import io from "socket.io-client"

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.$socket = io('wss://fargate.chat', {
    transports: ['websocket']
  })
})