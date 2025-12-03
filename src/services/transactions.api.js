import API from './axiosConfig';

export const getTransactionsRequest = (params) => API.get('/transactions', { params });
export const getTransactionsSummaryRequest = (params) => API.get('/transactions/summary', { params });
