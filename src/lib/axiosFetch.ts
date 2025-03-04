import { constants } from "@/lib/constants";
import axios from "axios";

export const axiosFetch = axios.create({
  baseURL: constants.BASE_URL,
  withCredentials: true,
});
