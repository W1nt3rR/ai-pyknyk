<template>
    <div id="home">
        <img class="terrain" :src="Terrain">
        {{ data }}
    </div>
</template>

<script setup lang="ts">
    import { onMounted, ref } from "vue";
    import Terrain from "../assets/maps/terrain.png";
    import axios from "axios";

    const data = ref(null);

    async function getData() {
        const response = await axios.post("http://127.0.0.1:8000/calculate/", {
            map: "map1",
            algorithm: "alg1",
        });

        data.value = response.data;
        console.log(data.value);
            
    }

    // Lifecycle
    onMounted(() => {
        getData();
    });
</script>

<style scoped lang="scss">
    #home {
        width: 100%;
        height: 100%;

        display: flex;
        justify-content: center;
        align-items: center;

        .terrain {
            height: 100%;
        }

    }
</style>
