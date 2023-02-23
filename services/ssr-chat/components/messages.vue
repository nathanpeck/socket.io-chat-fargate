<script setup>
import { useStore } from '~/store/state'
import { storeToRefs } from 'pinia'
import VirtualList from 'vue3-virtual-scroll-list'
import ChatMessage from './chat-message.vue'

const store = useStore()

const {
  activeMessages,
  scrollToBottom
} = storeToRefs(store)

const chatMessage = ChatMessage;

const vsl = ref(null)

watchEffect(() => {
  if (scrollToBottom.value) {
    console.log('scrolling to bottom');
    if (vsl.value) {
      scrollToBottom.value = false;
      nextTick(function () {
        vsl.value.scrollToBottom();
      })
    }
  }
})

let oldHeight = 0;

function loadMore() {
  oldHeight = vsl.value.getScrollSize();
  store.loadMoreInActiveRoom();
}

function scroll() {
  scrollToBottom.value = false;
}
</script>

<template>
  <ClientOnly> <!-- The virtual scroll relies on window size, which does not exist in the server -->
    <div id='messages-wrapper'>
      <virtual-list :size="50" :remain="8" :bench="44" class="list" :start="0" @totop='loadMore' @scroll='scroll'
        :data-key="'message'" :data-sources="activeMessages" :data-component="chatMessage" ref="vsl" />
      <typing></typing>
    </div>
    <template #fallback>
      Loading...
    </template>
  </ClientOnly>
</template>

<script>
export default {
  updated: function () {
    console.log('updated messages wrapper')
  }
}
</script>

<style>
#messages-wrapper {
  border-top: 3px solid #a8a8a8;
}

#messages-wrapper .list {
  height: auto;
  min-height: calc(100vh - 93px);
  max-height: calc(100vh - 93px);
  overflow-x: hidden;
  overflow-y: scroll;
}

@media screen and (max-width: 735px) {
  #messages-wrapper .list {
    max-height: calc(100vh - 105px);
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