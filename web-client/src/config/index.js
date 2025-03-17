// src/config/index.js
const config = {
    apiUrl: process.env.REACT_APP_API_URL ,//|| 'http://localhost:5001',
    urlImage:process.env.REACT_APP || 'http://localhost:5001',
    tokenKey: 'event_planner_token',
    refreshTokenKey: 'event_planner_refresh_token'
  };
  
  export default config;