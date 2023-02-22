<template>
  <div class='message-input-form'>
    <div class="wrap">
      <form name="form" v-on:submit.prevent="submit">
        Login, <a href='#' v-on:click='createAccount'>create an account</a>, or <a href='#' v-on:click='anonymous'>stay
          anonymous</a> to chat:
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
  </div>
</template>

<script>
export default {
  data: () => {
    return {
      belowMessagesView: useState('belowMessagesView')
    }
  },
  methods: {
    createAccount: function () {
      this.belowMessagesView = 'create-account'
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

.message-input-form {
  background: white;
  position: absolute;
  bottom: 0;
  width: 100%;
  z-index: 50;
  padding-bottom: 15px;
}

.message-input-form .wrap {
  margin: 15px;
}

.message-input-form .form-group {
  margin: 0px;
}

.message-input-form .input-group {
  margin-bottom: 5px;
}
</style>