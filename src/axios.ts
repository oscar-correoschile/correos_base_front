import axios from "axios";
import { useUsersStore } from "./store/users";

const token = useUsersStore.getState().token;
const instance = axios.create({
  // baseURL: 'http://localhost:8787',
  // timeout: 5000,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
export default instance;
