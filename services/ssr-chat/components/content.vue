<script setup>
const belowMessagesView = useState('belowMessagesView', () => 'message-input')
</script>

<template>
  <div id="content">
    <room-details></room-details>
    <messages></messages>
    <component :is="belowMessagesView"></component>
  </div>
</template>

<style scoped>
#content {
  float: right;
  width: 60%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

@media screen and (max-width: 735px) {
  #content {
    width: calc(100% - 58px);
    min-width: 300px !important;
  }
}

@media screen and (min-width: 850px) {
  #content {
    width: calc(100% - 340px);
  }
}
</style>