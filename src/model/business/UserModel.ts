
// Requires a 'settings' property in the User model on the 
// Classportal-backend MongoDB schema

export class User {
  snum: string;
  csid: string;
  username: string;
  userrole: string;
  fname: string;
  lname: string;
  profileUrl: string;
  courses: object[];
}