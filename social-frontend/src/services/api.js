import axios from "axios";

export default axios.create({
   //baseURL: "http://localhost:5000",
     baseURL: process.env.REACT_APP_API_URL,
});