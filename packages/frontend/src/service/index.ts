import createApi from "../utils";
import axios from "axios";

const instance = axios.create({
  baseURL: "",
});

const apiObj = {
  user: {
    list: "POST /api/v1/user/list",
  },
};

const api = createApi<typeof apiObj>(apiObj, instance);

export default api;
