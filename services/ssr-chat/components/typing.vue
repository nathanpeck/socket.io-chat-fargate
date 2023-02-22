<script setup>
/*const currentRoomTypers = useState('currentRoomTypers', () => [
  {
    avatar: 'https://www.gravatar.com/avatar/3a59977679d2616add79551c9f491b82?d=retro'
  },
  {
    avatar: 'https://www.gravatar.com/avatar/3a59977679d2616add79551c9f491b83?d=retro'
  }
])*/

const currentRoomTypers = useState('currentRoomTypers', () => []);
</script>

<template>
  <div v-if="currentRoomTypers.length > 0" class='message replies'>
    <img v-for='typer in currentRoomTypers' :src="typer.avatar" />
    <div class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</template>

<style>
/* Typing indicator based on https://codepen.io/fusco/pen/XbpaYv */
.typing-indicator {
  float: left;
  margin: 6px 0 0 8px;
  background-color: #f5f5f5;
  will-change: transform;
  width: auto;
  border-radius: 50px;
  padding: 15px;
  display: table;
  margin: 0 auto;
  position: relative;
  -webkit-animation: 2s bulge infinite ease-out;
  animation: 2s bulge infinite ease-out;
}

.typing-indicator span {
  height: 5px;
  width: 5px;
  float: left;
  margin: 0 1px;
  background-color: #32465a;
  display: block;
  border-radius: 50%;
  opacity: 0.4;
}

.typing-indicator span:nth-of-type(1) {
  -webkit-animation: 1s blink infinite 0.3333s;
  animation: 1s blink infinite 0.3333s;
}

.typing-indicator span:nth-of-type(2) {
  -webkit-animation: 1s blink infinite 0.6666s;
  animation: 1s blink infinite 0.6666s;
}

.typing-indicator span:nth-of-type(3) {
  -webkit-animation: 1s blink infinite 0.9999s;
  animation: 1s blink infinite 0.9999s;
}

@-webkit-keyframes blink {
  50% {
    opacity: 1;
  }
}

@keyframes blink {
  50% {
    opacity: 1;
  }
}

@-webkit-keyframes bulge {
  50% {
    -webkit-transform: scale(1.05);
    transform: scale(1.05);
  }
}

@keyframes bulge {
  50% {
    -webkit-transform: scale(1.05);
    transform: scale(1.05);
  }
}
</style>