import { environment } from '../../environments/environment';
const API_URL = environment.baseUrl;
 
export const apiUrl = {
    searchUrl: "https://uat-apim.heromotocorp.com/hws/query",
    dynamicFilterUrl:(query: string) =>"https://rndhwsdev.heromotocorp.com/queryservice/knowledgearea-filters?knowledge-area="+query,
    summarizeUrl: API_URL+'summarize',
    apiUrl: API_URL,
}
