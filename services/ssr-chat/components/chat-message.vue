<script setup>
const currentUsername = useState('currentUsername', () => 'anonymous_c5d0a2')
</script>

<template>
  <div :class="{ message: true, replies: source.username != currentUsername, sent: source.username == currentUsername }">
    <span class='sender'>{{ source.username }}</span>
    <img :src="source.avatar" />
    <p>{{ source.content.text }}</p>
  </div>
</template>

<script>
export default {
  props: {
    index: { // index of current item
      type: Number
    },
    source: {
      type: Object,
      default() {
        return {}
      }
    }
  }
}
</script>
