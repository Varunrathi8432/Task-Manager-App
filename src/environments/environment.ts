// DEV environment — points to your development Firebase project.
// For local development only. Never use this config in production.
export const environment = {
  production: false,
  storagePrefix: 'tm_',
  devCredentials: {
    email: 'varun@yopmail.com',
    password: 'Test@123',
  },
  firebase: {
    apiKey: 'AIzaSyBmPRKNUA3ynE1-4_vC_dYpItGK33Zc7qc',
    authDomain: 'task-manager-app-8e35c.firebaseapp.com',
    projectId: 'task-manager-app-8e35c',
    storageBucket: 'task-manager-app-8e35c.firebasestorage.app',
    messagingSenderId: '512071680377',
    appId: '1:512071680377:web:b956e1772a7241f9ccafa8',
  },
};
