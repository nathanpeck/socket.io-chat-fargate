var socket = io();

Vue.component('virtual-list', VirtualScrollList);

var store = {
  data: {
    state: {
      username: null,
      authenticated: false,
      avatar: null,
      activeRoom: 'general',
      lastTyping: Date.now(),
      belowMessagesView: 'message-input',
      presentCount: 0
    },

    activeRoom: {},
    activeMessages: [],

    messages: {
      general: [],
      ecs: [],
      eks: [],
      fargate: []
    },

    typing: [],

    rooms: [],

    events: []
  },

  // Mutate the data store to add a message
  liveMessage: function(message) {
    this.insertMessage(message);

    if (message.room !== this.data.state.activeRoom) {
      // Message arrive in another room, so need to trigger the dot on that room
      var arrivedRoom = this.data.rooms.find(function(room) {
        return room.id === message.room;
      });

      arrivedRoom.status = 'unread';
    }
  },

  insertMessage: function(message) {
    var inserted = false;

    var messageCount = this.data.messages[message.room].length;

    if (messageCount === 0) {
      // Insert into empty store.
      this.data.messages[message.room].push(message);
      return;
    }

    if (messageCount === 1) {
      // Insert second message
      if (message.time > this.data.messages[message.room][0].time) {
        this.data.messages[message.room].push(message);
        return;
      } else {
        this.data.messages[message.room].unshift(message);
        return;
      }
    }

    var last = this.data.messages[message.room][messageCount - 1];

    if (last.time < message.time) {
      // Optimize adding new latest message
      this.data.messages[message.room].push(message);
      return;
    }

    var first = this.data.messages[message.room][0];
    if (first.time > message.time) {
      // Optimize adding new oldest message
      this.data.messages[message.room].unshift(message);
      return;
    }

    // Fallthrough for insert in the middle of the set.
    console.log('middle insert?');
    for (var i = 0; i < this.data.messages[message.room].length - 1; i++) {
      if (this.data.messages[message.room][i].time >= message.time &&
          this.data.messages[message.room][i + 1].time <= message.time) {
        this.data.messages[message.room].splice(i, 0, message);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.data.messages[message.room].unshift(message);
    }
  },

  // Mutate the data store to switch the active room
  switchRoom: function(roomId) {
    this.data.state.activeRoom = roomId;

    this.data.activeRoom = this.data.rooms.find(function(room) {
      return room.id === roomId;
    });

    this.data.activeRoom.status = 'none'; // Clear unread indicator

    this.data.activeMessages = this.data.messages[roomId];
  },

  // Helper function that runs on a schedule and expires any typers that
  // have not emitted a typing event recently.
  _expireTypersInterval: null,
  _expireTypers: function() {
    var now = Date.now();

    for (var i = 0; i < this.data.typing.length; i++) {
      if (this.data.typing[i].until < now) {
        this.data.typing.splice(i, 1);
      }
    }

    if (this.data.typing.length === 0) {
      // No typers left so stop checking for then.
      clearInterval(this._expireTypersInterval);
      this._expireTypersInterval = null;
    }
  },

  // Mutate the data store to add a typing user.
  addTyper: function(typer) {
    // Add an expiration.
    typer.until = Date.now() + 3000;

    // Prevent dupes and the splice + push method triggers Vue update.
    this.removeTyper(typer);
    this.data.typing.push(typer);

    if (!this._expireTypersInterval) {
      // Now that we have typers, start checking every 500ms to see if we need to expire one or more.
      this._expireTypersInterval = setInterval(this._expireTypers.bind(this), 500);
    }
  },

  removeTyper: function(typer) {
    for (var i = 0; i < this.data.typing.length; i++) {
      if (this.data.typing[i].username === typer.username &&
          this.data.typing[i].room === typer.room) {
        this.data.typing.splice(i, 1);
        break;
      }
    }
  },

  // Helper function that runs on a schedule and expires any typers that
  // have not emitted a typing event recently.
  _expireEventsInterval: null,
  _expireEvents: function() {
    var now = Date.now();

    for (var i = 0; i < this.data.events.length; i++) {
      if (this.data.events[i].until < now) {
        this.data.events.splice(i, 1);
      }
    }

    if (this.data.events.length === 0) {
      // No typers left so stop checking for then.
      clearInterval(this._expireEventsInterval);
      this._expireEventsInterval = null;
    }
  },

  addEvent: function(event) {
    event.until = Date.now() + 3000;
    this.data.events.push(event);

    if (!this._expireEventsInterval) {
      // Now that we have events, start checking every 500ms to see if we need to expire one or more.
      this._expireEventsInterval = setInterval(this._expireEvents.bind(this), 500);
    }
  }
};

Vue.component('rooms', {
  template: `<div class='rooms'><ul>
    <li class="room" v-on:click="switchRoom(room.id)" :class="{ active: room.id==state.activeRoom }" v-for='room in rooms'>
      <div class="wrap">
        <span class="room-status" v-if="room.status!='none'" :class="room.status"></span>
        <img :src="room.image" alt="" />
        <div class="meta">
          <p class="name">{{ room.name }}</p>
          <p class="preview">{{ room.preview }}</p>
        </div>
      </div>
    </li>
  </ul></div>`,
  data: function() {
    return store.data;
  },
  methods: {
    switchRoom: function(roomId) {
      store.switchRoom(roomId);
    }
  },
  updated: function() {
    console.log('updated rooms');
  }
});

Vue.component('room-details', {
  template: `<div class="room-details">
    <img :src="activeRoom.image" alt="" class='description' />
    <p>{{ activeRoom.name }}</p>
    <div class='online-count dropdown'>
      {{ state.presentCount }} online
      <transition name='fade' appear>
        <ul class="dropdown-menu" v-if="events.length > 0" style='display: block;'>
          <template v-for='(event, index) in events'>
            <li class="item" :key="event.until + event.username + event.type"><img :src='event.avatar'>{{ event.username }} {{ event.type}}</li>
          </template>
        </ul>
      </transition>
    </div>
  </div>`,
  data: function() {
    return store.data;
  },
  updated: function() {
    console.log('updated room details');
  }
});

Vue.component('messages', {
  template: `
    <div class='messages-wrapper'>
      <virtual-list :size="50" :remain="8" :bench="44" class="list" :start="0" :totop='loadMore' :onscroll='scroll'>
        <div :class="{ message: true, replies: message.username!=state.username, sent: message.username==state.username}" v-for="(message, index) of activeMessages" :index="message.message" :key="message.message">
          <span class='sender'>{{ message.username }}</span>
          <img :src="message.avatar" />
          <p>{{ message.content.text }}</p>
        </div>
        <div v-if="currentRoomTypers.length > 0" class='message replies'>
          <img v-for='typer in currentRoomTypers' :src="typer.avatar" />
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </virtual-list>
    </div>
  `,
  data: function() {
    return {
      scrolled: false,
      loading: false,
      state: store.data.state,
      messages: store.data.messages,
      typing: store.data.typing
    };
  },
  computed: {
    currentRoomTypers: function() {
      var currentRoom = this.state.activeRoom;
      return this.typing.filter(function(typer) {
        return typer.room === currentRoom;
      });
    },

    activeMessages: function() {
      return this.messages[this.state.activeRoom];
    }
  },
  watch: {
    'state.activeRoom': function() {
      this.loadMore();
      this.scrolled = false;
    }
  },
  methods: {
    loadMore: function() {
      if (this.loading) {
        return true;
      }

      console.log('loading older messages');

      var self = this;

      this.loading = true;

      if (!this.state.activeRoom) {
        return;
      }

      var from = { room: this.state.activeRoom };

      if (this.messages[this.state.activeRoom].length) {
        from.message = this.messages[this.state.activeRoom][0].message;
      }

      var messageList = this.$el.querySelector('.list');
      this.oldHeight = messageList.scrollHeight;

      socket.emit(
        'message list',
        from,
        function(err, response) {
          for (var message of response.messages) {
            store.insertMessage(message);
          }

          self.loading = false;
        }
      );
    },

    scroll: function() {
      var messageList = this.$el.querySelector('.list');

      if (messageList.scrollTop + messageList.clientHeight === messageList.scrollHeight) {
        this.scrolled = false;
      } else {
        this.scrolled = true;
      }
    }
  },

  updated: function() {
    var messageList = this.$el.querySelector('.list');

    if (!this.scrolled) {
      // If the user hasn't manually scrolled up then automatically scroll to bottom
      messageList.scrollTop = messageList.scrollHeight;
    } else {
      // When we load more content in while scrolled up leave the scroll position in the same
      // place so that the content doesn't move.
      messageList.scrollTop = messageList.scrollHeight - this.oldHeight;
    }
  },

  mounted: function() {
    this.loadMore();
    this.scrolled = false;
  }
});

Vue.component('message-input', {
  template: `<div class="message-input">
    <div class="wrap">
    <input type="text" v-on:focus="check" id='textbox' v-on:keydown.enter="submit" v-on:keydown="startTyping" placeholder="Write your message..." />
    <button class="submit" v-on:click="submit"><i class="fa fa-paper-plane" aria-hidden="true"></i></button>
    </div>
  </div>`,
  data: function() {
    return store.data;
  },
  methods: {
    check: function() {
      if (!store.data.state.authenticated) {
        // Must hide self and show the login panel
        store.data.state.belowMessagesView = 'login';
      }
    },

    startTyping: function(event) {
      if (!store.data.state.authenticated || event.keyCode === 13 ||
          event.keyCode === 17 || event.keyCode === 18 || event.keyCode === 91 ||
          event.keyCode === 92) {
        return;
      }

      var now = Date.now();

      if (store.data.state.lastTyping > now - 2000) {
        // Already shared typing status less than two second ago.
        return;
      }

      socket.emit('typing', store.data.state.activeRoom);
      store.addTyper({
        room: store.data.state.activeRoom,
        username: store.data.state.username,
        avatar: store.data.state.avatar
      });
      store.data.state.lastTyping = now;
    },

    submit: function() {
      var textbox = this.$el.querySelector('#textbox');
      var text = textbox.value.trim();
      var self = this;

      if (text === '') {
        return;
      }

      socket.emit(
        'new message',
        {
          room: this.state.activeRoom,
          message: text
        },
        function(err, message) {
          if (err) {
            return console.error(err);
          }

          store.insertMessage(message);
          store.removeTyper({
            room: self.state.activeRoom,
            username: self.state.username
          });
          store.data.state.lastTyping = 0;
        }
      );

      socket.emit('stop typing', this.state.activeRoom);

      textbox.value = '';
    }
  }
});

Vue.component('login', {
  template: `<div class='message-input-form'>
    <div class="wrap">
      <form name="form" v-on:submit.prevent="submit">
        Login, <a href='#' v-on:click='createAccount'>create an account</a>, or <a href='#' v-on:click='anonymous'>stay anonymous</a> to chat:
        <br /> <br />
        <div class="input-group">
          <span class="input-group-addon"><i class="glyphicon glyphicon-user"></i></span>
          <input type="text" class="username form-control" name="username" value="" placeholder="Username" required>
        </div>
        <div class="input-group">
          <span class="input-group-addon"><i class="glyphicon glyphicon-lock"></i></span>
          <input type="password" class="password form-control" name="password" placeholder="Password" required>
        </div>
        <div class="form-group">
          <button class="btn btn-primary pull-right"><i class="glyphicon glyphicon-log-in"></i> Log in</button>
        </div>
      </form>
    </div>
  </div>`,
  methods: {
    anonymous: function() {
      socket.emit('anonymous user', function(err, response) {
        store.data.state.username = response.username;
        store.data.state.avatar = response.avatar;
        store.data.state.authenticated = true;
        store.data.state.belowMessagesView = 'message-input';
        console.log('logged in');
      });
    },

    createAccount: function() {
      store.data.state.belowMessagesView = 'create-account';
    },

    submit: function() {
      console.log('submit login');
      var self = this;

      var $username = this.$el.querySelector('.username');
      var username = $username.value.trim();

      var $password = this.$el.querySelector('.password');
      var password = $password.value.trim();

      socket.emit(
        'authenticate user',
        {
          username: username,
          password: password
        },
        function(err, response) {
          if (err) {
            console.error(err);

            if (err === 'No matching account found') {
              self.error = 'no-match';
            }

            return;
          }

          store.data.state.username = response.username;
          store.data.state.avatar = response.avatar;
          store.data.state.authenticated = true;
          store.data.state.belowMessagesView = 'message-input';

          console.log('logged in');
        }
      );
    }
  }
});

Vue.component('create-account', {
  template: `<div class='message-input-form'>
    <div class="wrap">
      <form name="form" id="create-form" v-on:submit.prevent="submit">
        <a href='#' v-on:click='login'>Login</a>, create an account, or <a href='#' v-on:click='anonymous'>stay anonymous</a> to chat:
        <br />
        <br />
        <p v-if="error=='username'" class="text-danger">Username is already taken</p> <br />
        <div class="form-group" :class="{'has-error': error=='username'}">
          <div class="input-group">
            <span class="input-group-addon"><i class="glyphicon glyphicon-user"></i></span>
            <input id="username" type="text" class="username form-control" name="username" value="" placeholder="Username" required>
          </div>
        </div>
        <div class="form-group">
          <div class="input-group">
            <span class="input-group-addon"><i class="glyphicon glyphicon-envelope"></i></span>
            <input type="text" class="email form-control" name="email" value="" placeholder="Email" required>
          </div>
        </div>
        <div class="form-group">
          <div class="input-group">
            <span class="input-group-addon"><i class="glyphicon glyphicon-lock"></i></span>
            <input type="password" class="password form-control" name="password" placeholder="Password" required>
          </div>
        </div>
        <div class="form-group">
          <button id="button" class="btn btn-primary pull-right"><i class="glyphicon glyphicon-log-in"></i> Create</button>
        </div>
      </form>
    </div>
  </div>`,
  data: function() {
    return {
      error: 'none'
    };
  },
  methods: {
    anonymous: function() {
      socket.emit('anonymous user', function(err, response) {
        store.data.state.username = response.username;
        store.data.state.avatar = response.avatar;
        store.data.state.authenticated = true;
        store.data.state.belowMessagesView = 'message-input';
        console.log('logged in');
      });
    },

    login: function() {
      store.data.state.belowMessagesView = 'login';
    },

    submit: function() {
      console.log('submit create account');
      var self = this;

      var $username = this.$el.querySelector('.username');
      var username = $username.value.trim();

      var $password = this.$el.querySelector('.password');
      var password = $password.value.trim();

      var $email = this.$el.querySelector('.email');
      var email = $email.value.trim();

      socket.emit(
        'create user',
        {
          username: username,
          email: email,
          password: password
        },
        function(err, response) {
          if (err) {
            console.error(err);

            if (err === 'That username is taken already.') {
              self.error = 'username';
            }

            return;
          }

          store.data.state.username = response.username;
          store.data.state.avatar = response.avatar;
          store.data.state.authenticated = true;
          store.data.state.belowMessagesView = 'message-input';
          console.log('logged in');
        }
      );
    }
  }
});

new Vue({
  el: '#frame',
  data: store.data
});

// Listen for new messages from the server, and add them to the local store.
socket.on('new message', function(message) {
  store.liveMessage(message);
});

// Listen for typers from the server and add to the local store
socket.on('typing', function(typer) {
  store.addTyper(typer);
});

// Listen for typers from the server and add to the local store
socket.on('stop typing', function(typer) {
  store.removeTyper(typer);
});

socket.emit('room list', function(err, rooms) {
  store.data.rooms = store.data.rooms.concat(rooms);
  store.switchRoom(store.data.rooms[0].id);
});

socket.on('user joined', function(joined) {
  store.data.state.presentCount = joined.numUsers;

  store.addEvent({
    type: 'joined',
    username: joined.username,
    avatar: joined.avatar
  });
});

socket.on('user left', function(left) {
  store.data.state.presentCount = left.numUsers;

  store.addEvent({
    type: 'left',
    username: left.username,
    avatar: left.avatar
  });
});

socket.on('presence', function(presence) {
  store.data.state.presentCount = presence.numUsers;
});

// Capture the enter key if not already captured by the textbox.
document.onkeydown = function(evt) {
  evt = evt || window.event;
  if (evt.keyCode === 13) {
    document.getElementById('textbox').focus();
  }
};
