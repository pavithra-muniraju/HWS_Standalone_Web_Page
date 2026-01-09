import { environment } from '../../environments/environment';
const API_URL = environment.baseUrl;
const apiEndPoint = environment.baseUrl.includes("rnd")?"rndhwsdev":"hws";
export const apiUrl = {
    
    searchUrl: environment.baseUrl.includes("rnd")?"https://uat-apim.heromotocorp.com/hws/query":'https://prod-apim.heromotocorp.com/server/query',

    dynamicFilterUrl:(query: string) =>`https://${apiEndPoint}.heromotocorp.com/queryservice/knowledgearea-filters?knowledge-area=`+query,
    summarizeUrl: API_URL+'summarize',
    apiUrl: API_URL,
    likeOrDislikeUrl: `https://${apiEndPoint}.heromotocorp.com/queryservice/api/items/reaction`, 
    addComments: `https://${apiEndPoint}.heromotocorp.com/queryservice/api/items/comment`, 

    getAllReaction: `https://${apiEndPoint}.heromotocorp.com/queryservice/api/items/reactions-by-ids`,
    getAllComments: `https://${apiEndPoint}.heromotocorp.com/queryservice/api/items/comments-by-id`, 

    getAdminSummary: `https://${apiEndPoint}.heromotocorp.com/queryservice/api/items/reactions/summary`,
    isAdmin: `https://${apiEndPoint}.heromotocorp.com/queryservice/api/items/admin/check`,
 
    reactionReport: `https://${apiEndPoint}.heromotocorp.com/queryservice/api/items/download/reactionreport`
}
