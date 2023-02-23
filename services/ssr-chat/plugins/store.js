import { defineStore } from 'pinia'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.$useStore = defineStore({
    id: 'state-store',
    state: () => {
      return {
        loading: false,
        scrollToBottom: false,

        activeRoom: {},

        messagesById: {},

        messages: {
          general: [],
          ecs: [],
          lambda: [],
          fargate: []
        },

        rooms: [],
      }
    },
    actions: {
      updateRooms: function (roomList) {
        this.rooms = roomList
      },

      setActiveRoomById: function (roomId) {
        if (this.activeRoom.id == roomId) {
          return; // Do nothing
        }

        console.log('setting active room to', roomId)

        this.scrollToBottom = true;
        this.activeRoom = this.rooms.find(function (room) {
          return room.id === roomId
        })
        // Clear unread indicator
        this.activeRoom.status = 'none';
      },

      loadMoreInActiveRoom: function () {
        if (this.loading) {
          return true
        }

        console.log('loading older messages')

        const self = this

        this.loading = true

        if (!this.activeRoom) {
          return
        }

        const from = { room: this.activeRoom.id }

        if (this.messages[this.activeRoom.id].length) {
          from.message = this.messages[this.activeRoom.id][0].message
        }

        nuxtApp.$socket.emit(
          'message list',
          from,
          function (err, response) {
            for (const message of response.messages) {
              self.insertMessage(message)
            }

            self.loading = false
          }
        )
      },

      insertMessage: function (message) {
        if (this.messagesById[message.message]) {
          // Message already known, no need to insert
          return;
        }

        this.messagesById[message.message] = message;

        let inserted = false

        const messageCount = this.messages[message.room].length

        if (messageCount === 0) {
          // Insert message into empty store.
          this.messages[message.room].push(message)
          return
        }

        if (messageCount === 1) {
          // Insert second message
          if (message.time > this.messages[message.room][0].time) {
            this.messages[message.room].push(message)
            return
          } else {
            this.messages[message.room].unshift(message)
            return
          }
        }

        const last = this.messages[message.room][messageCount - 1]

        if (last.time < message.time) {
          // Optimize adding new latest message
          this.messages[message.room].push(message)
          return
        }

        const first = this.messages[message.room][0]
        if (first.time > message.time) {
          // Optimize adding new oldest message
          this.messages[message.room].unshift(message)
          return
        }

        // Fallthrough for insert in the middle of the set.
        console.log('middle insert?')
        for (let i = 0; i < this.messages[message.room].length - 1; i++) {
          if (this.messages[message.room][i].time >= message.time &&
            this.messages[message.room][i + 1].time <= message.time) {
            this.messages[message.room].splice(i, 0, message)
            inserted = true
            break
          }
        }

        if (!inserted) {
          this.messages[message.room].unshift(message)
        }
      }
    },
    getters: {
      // Fetch the messages for the selected room
      activeMessages: (state) => {
        if (state.activeRoom) {
          return state.messages[state.activeRoom.id]
        } else {
          return []
        }
      }
    },
  })
})
