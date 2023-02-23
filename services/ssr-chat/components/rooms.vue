<script setup>
import { useStore } from '~/store/state'
import { storeToRefs } from 'pinia'

const store = useStore()

// Get references to data in the store
// which this component needs
const {
  rooms,
  activeRoom,
} = storeToRefs(store)

// Get store methods that this component needs
const {
  setActiveRoomById
} = store;
</script>

<template>
  <div id='rooms'>
    <ul>
      <li class="room" v-on:click="setActiveRoomById(room.id);" :class="{ active: room.id == activeRoom.id }"
        v-for='room in rooms'>
        <div class="wrap">
          <span class="room-status" v-if="room.status != 'none'" :class="room.status"></span>
          <img :src="room.image" alt="" />
          <div class="meta">
            <p class="name">{{ room.name }}</p>
            <p class="preview">{{ room.preview }}</p>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
#rooms {
  height: calc(100% - 177px);
  overflow: hidden;
  border-top: 3px solid #a8a8a8;
}

@media screen and (max-width: 735px) {
  #rooms {
    height: calc(100% - 149px);
    overflow-y: scroll;
    overflow-x: hidden;
  }

  #rooms::-webkit-scrollbar {
    display: none;
  }
}

#rooms.expanded {
  height: calc(100% - 334px);
}

#rooms ul {
  margin: 0px;
  padding: 0px;
  width: 100%;
}

#rooms ul li.room {
  position: relative;
  padding: 10px 0 15px 0;
  font-size: 0.9em;
  cursor: pointer;
  border-right: 5px solid #d6dada;
}

@media screen and (max-width: 735px) {
  #rooms ul li.room {
    padding: 6px 0 46px 8px;
  }
}

#rooms ul li.room:hover {
  background: #E6EAEA;
}

#rooms ul li.room.active {
  background: #E6EAEA;
  border-right: 5px solid #FF9900;
}

#rooms ul li.room.active span.room-status {
  border: 2px solid #E6EAEA !important;
}

#rooms ul li.room .wrap {
  width: 88%;
  margin: 0 auto;
  position: relative;
}

@media screen and (max-width: 735px) {
  #rooms ul li.room .wrap {
    width: 100%;
  }
}

#rooms ul li.room .wrap span {
  position: absolute;
  left: 0;
  margin: -2px 0 0 -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #2c3e50;
  background: #95a5a6;
}

#rooms ul li.room .wrap span.online {
  background: #2ecc71;
}

#rooms ul li.room .wrap span.away {
  background: #f1c40f;
}

#rooms ul li.room .wrap span.unread {
  background: #FF9900;
}

#rooms ul li.room .wrap span.none {
  background: transparent;
  border: 0px transparent;
}

#rooms ul li.room .wrap img {
  width: 40px;
  border-radius: 10%;
  float: left;
  margin-right: 10px;
}

@media screen and (max-width: 735px) {
  #rooms ul li.room .wrap img {
    margin-right: 0px;
  }
}

#rooms ul li.room .wrap .meta {
  padding: 5px 0 0 0;
}

@media screen and (max-width: 735px) {
  #rooms ul li.room .wrap .meta {
    display: none;
  }
}

#rooms ul li.room .wrap .meta .name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#rooms ul li.room .wrap .meta .preview {
  margin: 5px 0 0 0;
  padding: 0 0 1px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#rooms ul li.room .wrap .meta .preview span {
  position: initial;
  border-radius: initial;
  background: none;
  border: none;
  padding: 0 2px 0 0;
  margin: 0 0 0 1px;
  opacity: .5;
}
</style>