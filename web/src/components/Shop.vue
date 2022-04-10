<template>
  <div class="content">
    <div class="products">
      <div  v-for="(row, index) in rows" class="row" :key="index">
        <router-link :to="'/card/' + product.id" v-for="product in row" :key="product.id" class="product">
          <div class="mask"/>
          <div class="product__image">
            <img
              :src="product.avatar"
              :alt="product.name"
            >
          </div>
          <div class="product__header">{{ product.name }}</div>
          <div class="product__price">{{ product.price }} баллов</div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import products from '../products.json'

export default {
  name: 'Shop',
  computed: {
    rows() {
      let rows = [];
      for (let i=2; i < products.length+1; i+=3 ) {
        let items = [products[i-2]];
        if (products[i-1]) {
          items.push(products[i-1])
        }
        if (products[i]) {
          items.push(products[i])
        }
        rows.push(items)
      }
      return rows
    }
  },

  data () {
    return {
      products: products,
      showCart: false
    };
  }
}
</script>

<style scoped>
  .row {
    width: calc(100% - 64px);
    display: flex;
    justify-content: space-between;
    margin: 24px 32px;
  }

  .product {
    padding: 16px;
    height: 260px;
    width: 300px;

    border-radius: 12px;
    box-shadow: 0 2px 24px 0 rgba(0, 0, 0, 0.08), 0 0 4px 0 rgba(0, 0, 0, 0.08);

    text-decoration: none;
    color: black;
    text-align: left;
    position: relative;
    overflow: hidden;
  }

  .product__image {
    width: 300px;
    height: 200px;
    overflow: hidden;
    position: relative;
    border-radius: 12px;
  }

  .product__header {
    font-size: 18px;
    margin-top: 16px;
  }

  .mask {
    position: absolute;
    transition: background-color 0.2s ease-in-out;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 5;
  }

  .mask:hover {
    background-color: rgba(0,0,0,0.1);
  }

  .product__price {
    margin-top: 4px;
    font-weight: 600;
    font-size: 16px;
  }

  .product__image img {
    position: absolute;
    max-width: 300px;
    left: 0;
  }
</style>
