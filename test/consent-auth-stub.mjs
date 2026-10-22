import http from 'node:http';
http.createServer((request,response)=>{
  response.setHeader('Content-Type','application/json');
  if (request.url==='/api/auth/login' || request.url==='/admin-api/auth/login') response.end(JSON.stringify({data:{token:'test.payload.signature',user:{id:'test-user',email:'test@example.invalid',displayName:'Test'}}}));
  else if(request.url==='/api/auth/me' && request.headers.authorization==='Bearer test.payload.signature') response.end(JSON.stringify({id:'test-user',email:'test@example.invalid',displayName:'Test'}));
  else {response.statusCode=404;response.end('{}');}
}).listen(3201,'127.0.0.1',()=>console.log('Local authentication stub ready'));
