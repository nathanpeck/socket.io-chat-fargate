// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: [
    'bootstrap/dist/css/bootstrap.min.css'
  ],
  app: {
    head: {
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,600,700,300"
        },
        {
          rel: "stylesheet",
          href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.2/css/font-awesome.min.css"
        },
        {
          rel: 'script',
          href: 'https://cdn.socket.io/4.5.4/socket.io.min.js'
        }
      ]
    }
  },
  modules: [
    '@pinia/nuxt'
  ],
  ssr: true
})
