import Vue from 'vue'
import Router from 'vue-router'
import Shop from '../components/Shop'
import ShoppingCard from '../components/ShoppingCard'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Shop',
      component: Shop
    },
    {
      path: '/card',
      name: 'Shopping Card',
      component: ShoppingCard,
      children: [
        {
          path: '/card/:id',
          component: ShoppingCard
        }
      ]
    }
  ]
})
