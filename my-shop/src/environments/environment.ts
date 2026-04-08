export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyBYZ0DLeYuWfmQaUDxUD8TYK9qeSlPFOKs",
    authDomain: "mymyofficial-12e0c.firebaseapp.com",
    projectId: "mymyofficial-12e0c",
    storageBucket: "mymyofficial-12e0c.firebasestorage.app",
    messagingSenderId: "307655793084",
    appId: "1:307655793084:web:2bb2e1107ecd62c505f3b9"
  },
// 👇 新增：公司全站共用資訊庫 👇
  company: {
    name: '92MYMY',                 // 品牌名稱 (顯示在大標題)
    fullName: '三日拾光工作室',   // 公司完整名稱 (法規要求)
    taxId: '60893893',              // 統一編號
    email: 'sunew.studio@gmail.com',  // 客服信箱
    phone: '0973-442282',     // 客服電話
    address: '台中市西屯區精誠路50巷27號',       // 公司地址 (選填，目前頁尾沒印出，但可備用)
    lineUrl: 'https://lin.ee/OkCK13L', // 官方 LINE 連結
    igUrl: 'https://www.instagram.com/92mymy_official/' // 官方 IG 連結
  }
  
};
