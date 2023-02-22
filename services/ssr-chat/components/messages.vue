<script setup>
const currentUsername = useState('currentUsername', () => 'test')
const activeMessages = useState('activeMessage', () => [
  {
    username: 'test',
    avatar: 'https://www.gravatar.com/avatar/3a59977679d2616add79551c9f491b82?d=retro',
    content: {
      text: 'This is a test'
    }
  }
])
</script>

<template>
  <div id='messages-wrapper'>
    <!--<virtual-list :size="50" :remain="8" :bench="44" class="list" :start="0" :totop='loadMore' :onscroll='scroll'>-->
    <div class="list">
      <div
        :class="{ message: true, replies: message.username != currentUsername, sent: message.username == currentUsername }"
        v-for="(message, index) of activeMessages" :index="message.message" :key="message.message">
        <span class='sender'>{{ message.username }}</span>
        <img :src="message.avatar" />
        <p>{{ message.content.text }}</p>
      </div>
    </div>

    <typing></typing>
    <!--</virtual-list>-->
  </div>
</template>

<style>
#messages-wrapper {
  border-top: 3px solid #a8a8a8;
}

#messages-wrapper .list {
  height: auto;
  min-height: calc(100% - 93px);
  max-height: calc(100% - 93px);
  overflow-x: hidden;
  overflow-y: scroll;
}

@media screen and (max-width: 735px) {
  #messages-wrapper .list {
    max-height: calc(100% - 105px);
  }
}

#messages-wrapper .list::-webkit-scrollbar {
  width: 8px;
  background: transparent;
}

#messages-wrapper .list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
}

#messages-wrapper .list .message:nth-last-child(1) {
  margin-bottom: 20px;
}

#messages-wrapper .list .message {
  display: inline-block;
  margin: 5px 15px 5px 15px;
  width: calc(100% - 25px);
  font-size: 0.9em;
}

#messages-wrapper .list .message img {
  margin: 6px 8px 0 0;
  width: 22px;
  border-radius: 50%;
  float: left;
}

#messages-wrapper .list .message p {
  float: left;
  padding: 10px 15px;
  border-radius: 20px;
  max-width: calc(100% - 45px);
  line-height: 130%;
  word-wrap: break-word;
}

#messages-wrapper .list .message .sender {
  display: block;
  clear: right;
  padding: 2px 40px;
  font-size: 0.8em;
  font-color: #888888;
}

#messages-wrapper .list .message.sent p {
  background: #FF8800;
  color: #f5f5f5;
}

#messages-wrapper .list .message.replies p {
  background: #f5f5f5;
}
</style>