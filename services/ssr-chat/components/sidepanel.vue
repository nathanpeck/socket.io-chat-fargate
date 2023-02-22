<template>
  <div id='sidepanel'>
    <search></search>
    <rooms></rooms>
  </div>
</template>

<style scoped>
#sidepanel {
  float: left;
  min-width: 280px;
  max-width: 340px;
  width: 40%;
  height: 100%;
  background: #dadfdf;
  color: #32465a;
  overflow: hidden;
  position: relative;
}

@media screen and (max-width: 735px) {
  #sidepanel {
    width: 58px;
    min-width: 58px;
  }
}
</style>