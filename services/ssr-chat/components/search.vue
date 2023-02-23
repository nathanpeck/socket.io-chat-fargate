<template>
  <div id='search' v-on:click='searching = true'>
    <img src='/static/images/search.svg' alt="" class='search' />
    <p>Search</p>
  </div>
</template>

<script setup>
const searching = useState('searching');
</script>

<style scoped>
#search {
  width: 100%;
  height: 60px;
  line-height: 60px;
  background: #eaeaea;
  cursor: pointer;
  border-right: 3px solid #e3e2e2;
}

#search:hover {
  background: #f0f0f0;
}

#search img {
  width: 30px;
  border-radius: 10%;
  float: left;
  margin: 15px 15px 0px 24px
}

/* When the sidebar is collapsed hide the text and center the image */
@media screen and (max-width: 735px) {
  #search p {
    display: none;
  }

  #search img {
    margin: 15px 15px 0px 14px
  }
}
</style>