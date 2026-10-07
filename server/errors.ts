export class UserFacingError extends Error {
 constructor(message:string,public statusCode=422,public code='EVIDENCE_UNAVAILABLE'){super(message);}
}
