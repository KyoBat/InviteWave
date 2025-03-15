// src/config/index.js
const config = {
    apiUrl: process.env.REACT_APP_API_URL ,//|| 'http://localhost:5001',
    url:process.env.REACT_APP,
    tokenKey: 'event_planner_token',
    refreshTokenKey: 'event_planner_refresh_token'
  };
  
  export default config;