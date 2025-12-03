import { environment } from '../../environments/environment';
const API_URL = environment.baseUrl;
 
export const apiUrl = {
    searchUrl: "https://uat-apim.heromotocorp.com/hws/query",
    dynamicFilterUrl:(query: string) =>"https://rndhwsdev.heromotocorp.com/queryservice/knowledgearea-filters?knowledge-area="+query,
    summarizeUrl: API_URL+'summarize',
    apiUrl: API_URL,
    likeOrDislikeUrl: 'https://rndhwsdev.heromotocorp.com/queryservice/api/items/reaction', 
    addComments: 'https://rndhwsdev.heromotocorp.com/queryservice/api/items/comment', 

    getAllReaction: 'https://rndhwsdev.heromotocorp.com/queryservice/api/items/reactions-by-ids',
    getAllComments: 'https://rndhwsdev.heromotocorp.com/queryservice/api/items/comments-by-id', 

    getAdminSummary: 'https://rndhwsdev.heromotocorp.com/queryservice/api/items/reactions/summary',
    isAdmin: 'https://rndhwsdev.heromotocorp.com/queryservice/api/items/admin/check',
 
    reactionReport: 'https://rndhwsdev.heromotocorp.com/queryservice/api/items/download/reactionreport'
}
