<template>
  <div class="message-input">
    <div class="wrap">
      <input type="text" v-on:focus="check" id='textbox' v-on:keydown.enter="submit" v-on:keydown="startTyping"
        placeholder="Write your message..." />
      <button class="submit" v-on:click="submit"><i class="fa fa-paper-plane" aria-hidden="true"></i></button>
    </div>
  </div>
</template>

<script>
export default {
  data: () => {
    return {
      authenticated: useState('authenticated'),
      belowMessagesView: useState('belowMessagesView')
    }
  },
  methods: {
    check: function () {
      if (!this.authenticated) {
        this.belowMessagesView = 'login'
      }
    }
  }
}
</script>

<style>
.message-input {
  position: absolute;
  bottom: 0;
  width: 100%;
  z-index: 50;
}

.message-input .wrap {
  position: relative;
}

.message-input .wrap input {
  font-family: "proxima-nova", "Source Sans Pro", sans-serif;
  float: left;
  border: none;
  width: calc(100% - 50px);
  padding: 11px 32px 12px 8px;
  font-size: 0.8em;
  color: #32465a;
}

@media screen and (max-width: 735px) {
  .message-input .wrap input {
    padding: 15px 32px 16px 8px;
  }
}

.message-input .wrap input:focus {
  outline: none;
}

.message-input .wrap button {
  float: right;
  border: none;
  width: 50px;
  padding: 12px 0;
  cursor: pointer;
  background: linear-gradient(228deg, rgb(255 138 35), rgb(217, 96, 15), rgb(186, 61, 21));
  color: #f5f5f5;
}

@media screen and (max-width: 735px) {
  .message-input .wrap button {
    padding: 16px 0;
  }
}

.message-input .wrap button:hover {
  background: #FF8800;
}

.message-input .wrap button:focus {
  outline: none;
}

#frame .content .message-input-form {
  background: white;
  position: absolute;
  bottom: 0;
  width: 100%;
  z-index: 50;
  padding-bottom: 15px;
}

#frame .content .message-input-form .wrap {
  margin: 15px;
}

#frame .content .message-input-form .form-group {
  margin: 0px;
}

#frame .content .message-input-form .input-group {
  margin-bottom: 5px;
}
</style>