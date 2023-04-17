import { createApp } from "vue";
import "./style.css";
import "./assets/iconfont.css";

import { Button, Radio, RadioGroup, message } from "ant-design-vue";
import App from "./App.vue";


import Antd from 'ant-design-vue';//引入ant-design-vue所有组件
import 'ant-design-vue/dist/antd.less';//引入ant-design-vue CSS

createApp(App).use(Antd).mount("#app");
