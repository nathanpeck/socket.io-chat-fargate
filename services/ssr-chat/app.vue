<script setup>
import { storeToRefs } from 'pinia'
const { $useStore } = useNuxtApp()

// Start out not logged in
const authenticated = useState('authenticated', () => false)

const { $socket } = useNuxtApp()

// Fetch the room list
const roomData = await new Promise(function (resolve, reject) {
  $socket.emit('room list', function (err, responseRooms) {
    if (err) {
      reject(err)
    }
    resolve(responseRooms);
  });
});

const store = $useStore()
store.updateRooms(roomData);
store.setActiveRoomById(roomData[0].id)

const from = { room: store.activeRoom.id }
const messageData = await new Promise(function (resolve, reject) {
  $socket.emit(
    'message list',
    from,
    function (err, response) {
      if (err) [
        reject(err)
      ]

      for (const message of response.messages) {
        store.insertMessage(message);
      }

      store.scrollToBottom = true;

      resolve()
    }
  )
});
</script>

<template>
  <div id="frame">
    <sidepanel></sidepanel>
    <content></content>
    <searcher></searcher>
  </div>
</template>

<style>
/* Based on meyer-reset 2.0 */
html,
body,
div,
span,
applet,
object,
iframe,
h1,
h2,
h3,
h4,
h5,
h6,
p,
blockquote,
pre,
a,
abbr,
acronym,
address,
big,
cite,
code,
del,
dfn,
em,
img,
ins,
kbd,
q,
s,
samp,
small,
strike,
strong,
sub,
sup,
tt,
var,
b,
u,
i,
center,
dl,
dt,
dd,
ol,
ul,
li,
fieldset,
form,
label,
legend,
table,
caption,
tbody,
tfoot,
thead,
tr,
th,
td,
article,
aside,
canvas,
details,
embed,
figure,
figcaption,
footer,
header,
hgroup,
menu,
nav,
output,
ruby,
section,
summary,
time,
mark,
audio,
video {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 100%;
  font: inherit;
  vertical-align: baseline
}

article,
aside,
details,
figcaption,
figure,
footer,
header,
hgroup,
menu,
nav,
section {
  display: block
}

body {
  line-height: 1
}

ol,
ul {
  list-style: none
}

blockquote,
q {
  quotes: none
}

blockquote:before,
blockquote:after,
q:before,
q:after {
  content: '';
  content: none
}

table {
  border-collapse: collapse;
  border-spacing: 0
}

/* Now specify custom rules */
body {
  padding: 0px;
  margin: 0px;
  min-height: 100vh;
  background: #042029;
  font-family: "proxima-nova", "Source Sans Pro", sans-serif;
  font-size: 1em;
  letter-spacing: 0.1px;
  color: #32465a;
  text-rendering: optimizeLegibility;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.004);
  -webkit-font-smoothing: antialiased;
}

a {
  color: #FF9900;
}

a:hover {
  color: #FF8800;
}

.btn {
  border: 1px solid #FF9900;
  background: #FF8800;
}

.btn:hover {
  border: 1px solid #FF9900;
  background: #FF9900;
}


#frame {
  width: 100%;
  min-width: 360px;
  /*max-width: 1000px;*/
  height: 100vh;
  min-height: 300px;
  background: #E6EAEA;
}

@media screen and (max-width: 360px) {
  #frame {
    width: 100%;
    height: 100vh;
  }
}
</style>
