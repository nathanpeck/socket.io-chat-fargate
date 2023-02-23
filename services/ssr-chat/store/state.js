import { defineStore } from 'pinia'

export const useStore = defineStore({
  id: 'state-store',
  state: () => {
    return {
      /*state: {
        username: null,
        authenticated: false,
        avatar: null,
        lastTyping: Date.now(),
        belowMessagesView: 'message-input',
        presentCount: 0
      },*/

      activeRoom: {},

      messagesById: {},

      messages: {
        general: [],
        ecs: [],
        lambda: [],
        fargate: []
      },

      //typing: [],

      rooms: [],

      //events: [],

      /*search: {
        searching: false,
        searchTerm: '',
        searchResults: []
      }*/
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
      this.activeRoom = this.rooms.find(function (room) {
        return room.id === roomId
      })

      // Clear unread indicator
      this.activeRoom.status = 'none';

      // Scroll chat to the bottom

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