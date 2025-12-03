import API from "./axiosConfig";

export const getBornesRequest = () => API.get("/bornes");
export const getBornesStatsRequest = () => API.get("/bornes/stats");
