import "./scss/main.scss";

import axios from "axios";
import config from "./config";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

// Setup axios
axios.defaults.baseURL = config.API_URL;

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");
