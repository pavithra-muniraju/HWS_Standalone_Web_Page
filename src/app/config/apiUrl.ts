import { environment } from '../../environments/environment';
const API_URL = environment.baseUrl;
 
export const apiUrl = {
    searchUrl: "https://uat-apim.heromotocorp.com/hws/query",
    summarizeUrl: API_URL+'summarize',
    apiUrl: API_URL,
}