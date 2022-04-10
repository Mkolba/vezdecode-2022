<template>
  <div class="ShoppingCard">
    <div class="product__image">
      <img
        :src="product.avatar"
        :alt="product.name"
      >
    </div>
    <div class="content">
      <div class="product__header">{{ product.name }}</div>
      <div class="product__price">{{ product.price }} баллов</div>
      <div class="product__description">{{ product.description }}</div>
    </div>
  </div>
</template>

<script>
import products from '../products.json';

export default {
  name: 'ShoppingCard',
  data () {
    return {
      products: products
    };
  },
  computed: {
    id() {
      return this.$route.params.id;
    },

    product() {
      let product = products.filter(item => String(item.id) === this.$route.params.id);
      return product.length ? product[0] : {name: 'Товар не найден'}
    }
  },
}
</script>

<style scoped>
  .ShoppingCard {
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .content {
    margin-left: 24px;
    text-align: left;
  }

  .product__header {
    font-size: 24px;
  }

  .product__description {
    margin-top: 32px;
    white-space: pre-line;
  }
</style>
