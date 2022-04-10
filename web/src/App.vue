<template>
  <div id="app">
    <nav class="nav">
      <div class="nav__header">Магазин подарков</div>
      <div class="nav__cart">

      </div>
    </nav>
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat&display=swap');
#app {
  font-family: 'Montserrat', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.nav {
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.125);
  text-align: left;
  margin-bottom: 48px;
  height: 48px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.nav__header {
  font-size: 24px;
  margin-left: 32px;
}

body {
  margin: 0
}
</style>
