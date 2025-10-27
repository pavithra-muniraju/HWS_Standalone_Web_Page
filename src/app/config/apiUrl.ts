import { environment } from '../../environments/environment';
const API_URL = environment.baseUrl;
 
export const apiUrl = {
    searchUrl: "https://uat-apim.heromotocorp.com/hws/query",
    dynamicFilterUrl:"https://rndhwsdev.heromotocorp.com/queryservice/knowledgearea-filters",
    summarizeUrl: API_URL+'summarize',
    apiUrl: API_URL,
}
