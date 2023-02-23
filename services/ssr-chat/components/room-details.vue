<script setup>
import { useStore } from '~/store/state'
import { storeToRefs } from 'pinia'

const store = useStore()

const {
  activeRoom
} = storeToRefs(store)

const presentCount = useState('presentCount', () => 0)
const events = useState('events', () => [
  {
    type: 'joined',
    username: 'test',
    avatar: 'https://www.gravatar.com/avatar/3a59977679d2616add79551c9f491b82?d=retro'
  }
])
</script>

<template>
  <div id="room-details">
    <img :src="activeRoom.image" alt="" class='description' />
    <p>{{ activeRoom.name }}</p>
    <div class='online-count dropdown'>
      {{ presentCount }} online
      <transition name='fade' appear>
        <ul class="dropdown-menu" v-if="events.length > 0" style='display: block;'>
          <template :key="event.until + event.username + event.type" v-for='(event, index) in events'>
            <li class="item"><img :src='event.avatar'>{{ event.username
            }} {{ event.type }}</li>
          </template>
        </ul>
      </transition>
    </div>
  </div>
</template>

<style>
#room-details {
  width: 100%;
  height: 60px;
  line-height: 60px;
  background: #f5f5f5;
}

#room-details img.description {
  width: 40px;
  border-radius: 10%;
  float: left;
  margin: 9px 12px 0 9px;
}

#room-details p {
  float: left;
}

#room-details .online-count {
  float: right;
  margin-left: 14px;
  margin-right: 20px;
}


/* Dropdown with arrow adapted from https://bootsnipp.com/snippets/featured/dropdown-menu-ui */
.dropdown {
  z-index: 11
}

.dropdown-menu>li.item {
  line-height: 22px;
  margin-left: 1em;
  margin-right: 1em;
  vertical-align: baseline;
  white-space: nowrap;
}

.dropdown-menu>li.divider {
  margin-top: 5px;
  margin-bottom: 5px;
}

.dropdown-menu>li.item img {
  width: 22px;
  border-radius: 50%;
  margin: 0 5px 0 0;
  vertical-align: middle
}

.dropdown ul.dropdown-menu {
  position: absolute;
  top: calc(100% - 15px);
  left: unset;
  right: 0px;
  border-radius: 4px;
  box-shadow: none;
  margin-top: 20px;
}

.dropdown ul.dropdown-menu:before {
  content: "";
  border-bottom: 10px solid #fff;
  border-right: 10px solid transparent;
  border-left: 10px solid transparent;
  position: absolute;
  top: -10px;
  right: 16px;
  z-index: 10;
}

.dropdown ul.dropdown-menu:after {
  content: "";
  border-bottom: 12px solid #ccc;
  border-right: 12px solid transparent;
  border-left: 12px solid transparent;
  position: absolute;
  top: -12px;
  right: 14px;
  z-index: 9;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .5s;
}

.fade-enter,
.fade-leave-to

/* .fade-leave-active below version 2.1.8 */
  {
  opacity: 0;
}
</style>