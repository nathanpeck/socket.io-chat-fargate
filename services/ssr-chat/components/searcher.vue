<script setup>
const searching = useState('searching', () => false)
</script>

<template>
  <div v-if='searching'>
    <div class='overlay' v-on:click='searching = false'></div>
    <div class="searcher">
      <div class="searchInput">
        <input id='search-field' type="text" placeholder="Enter search..." v-model='searchTerm' @input="onChange"
          autocomplete="off">
        <div class="icon"><i class="fa fa-search"></i></div>
        <div class="resultBox">
          <div class="message" v-for="(message, index) of searchResults" :index="message.message" :key="message.message">
            <span class='sender'>{{ message.username }}</span>
            <img :src="message.avatar" />
            <p v-html="textBoldSearchTerm(message.content.text)"></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* DIV-element with black background and 50% opacity set */
div.overlay {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: rgb(212, 208, 208);
  opacity: 0.5;
  filter: alpha(opacity=50);
  z-index: 80;
  /* required for opacity to work in IE */
}

.searcher {
  position: relative;
  max-width: 600px;
  margin: 0px auto;
  padding-top: 150px;
  z-index: 99;
}

.searcher .searchInput {
  background: #fff;
  width: 100%;
  height: auto;
  border-radius: 5px;
  position: absolute;
  box-shadow: 0px 1px 5px 3px rgba(0, 0, 0, 0.12);
}

.searchInput input {
  height: 55px;
  width: 100%;
  outline: none;
  border: none;
  border-radius: 5px;
  padding: 0 60px 0 20px;
  font-size: 18px;
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.1);
}

.searchInput.active input {
  border-radius: 5px 5px 0 0;
}

.searchInput .resultBox {
  padding: 0;
  opacity: 1;
  pointer-events: none;
  max-height: 280px;
  overflow-y: auto;
}

.searchInput .icon {
  position: absolute;
  right: 0px;
  top: 0px;
  height: 55px;
  width: 55px;
  text-align: center;
  line-height: 55px;
  font-size: 20px;
  color: gray;
  cursor: pointer;
}

.searchInput .icon i {
  margin-top: 17px;
}

b {
  font-weight: bold;
}


.searcher .message {
  padding: 10px;
  padding-bottom: 15px;
  display: inline-block;
  width: 100%;
  font-size: 0.9em;
  border-bottom: 1px solid #ebebeb;
  pointer-events: auto;
  cursor: pointer;
}

.searcher .message:last-child {
  border-bottom: none;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}

.searcher .message:hover {
  background: #ffd6b9;
}

.searcher .message img {
  margin: 6px 8px 0 0;
  width: 22px;
  border-radius: 50%;
  float: left;
}

.searcher .message p {
  float: left;
  padding: 10px 15px;
  border-radius: 20px;
  max-width: calc(100% - 45px);
  line-height: 130%;
  word-wrap: break-word;
  background-color: #ebebeb
}

.searcher .message .sender {
  display: block;
  clear: right;
  padding: 2px 40px;
  font-size: 0.8em;
  color: #888888;
}
</style>