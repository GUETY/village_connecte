import API from "./axiosConfig";
export const getAlertesRequest = () => API.get("/alertes");
export const createAlerteRequest = (payload) => API.post("/alertes", payload);
export const deleteAlerteRequest = (id) => API.delete(`/alertes/${id}`);
export const getAlerteRequest = (id) => API.get(`/alertes/${id}`);
