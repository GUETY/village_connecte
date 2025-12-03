import API from "./axiosConfig";
export const getGroupsRequest = () => API.get("/groups");
export const createGroupRequest = (payload) => API.post("/groups", payload);
export const updateGroupRequest = (id, payload) => API.put(`/groups/${id}`, payload);
export const deleteGroupRequest = (id) => API.delete(`/groups/${id}`);
