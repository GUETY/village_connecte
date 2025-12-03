import API from "./axiosConfig";

export const saveAccessRulesRequest = (payload) => API.post("/access-rules", payload);
export const getAccessRulesRequest = () => API.get("/access-rules");
