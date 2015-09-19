/**
 * Created by fdl on 15/9/18.
 * @file 实现登录 注册 发表文章
 *
 *
 * 1.访问/reg 显示注册页面， 输入用户和密码.通过post的方式提交表单到/reg，后台可以注册用户。 var users = [{username:'zfpx','password':'123456'}]; 然后跳转到登陆页面/login。 2.get请求访问登陆页面/login， 输入用户名和密码，然后通过post方式提交表单到/login， 后台判断用户和密码是否正确，如果正确， 则把用户信息放入session,并返回主页/home。在主页显示用户名 3.需要权限判断，如果未登陆，只能访问注册和登陆。如果已登陆 只能访问主页/home.如果不符合要求，则提示没有授权。 4.(可选)发表文章和显示文章的功能
 */
var http = require('http');
var uuid = require('uuid');
var fs = require('fs');
var url = require('url');
var mime = require('mime');
var formidable = require('formidable');
var querystring = require('querystring');
var session = {};
var user = {};
var key = 'fdl';
var EXP_TIME =10*1000;
http.createServer(function(req,res){
    var urlObj = url.parse(req.url);
    var cookieObj = querystring.parse(req.headers.cookie,'; ');
    var flag = session[cookieObj[key]];
    console.log(flag)
    if('./favicon.ico'==urlObj.pathname){
        req.writeHead(404);
        res.end(http.STATUS_CODES[404]);
    }else{

            var now = new Date().getTime();
            if(urlObj.pathname=='/'||urlObj.pathname=='/index'){
                var cookieObj = querystring.parse(req.headers.cookie);
                fs.createReadStream('./reg.html').pipe(res);
            }
            else if(urlObj.pathname=='/home'){
                if(flag){
                    if(flag && flag.expTime && flag.expTime.getTime()>now ){
                        flag.expTime=new Date(new Date().getTime()+EXP_TIME);
                        fs.createReadStream('./showPage.html').pipe(res);
                    }else{
                        fs.createReadStream('./reg.html').pipe(res);
                    }
                }else{
                    fs.createReadStream('./reg.html').pipe(res);
                }
            }
            else if(urlObj.pathname=='/reg'){
                var user = {};
                var reg = formidable.IncomingForm();
                reg.parse(req,function(err,fields,files){

                    var avatar = './upload/'+files.avatar.path;
                    if(files.avatar.path!=''){
                        fs.createReadStream(files.avatar.path).pipe(fs.createWriteStream(avatar+'.'+files.avatar.path.split('.')[1]));
                    }else{
                        avatar='';
                    }
                    user.name = fields.username;
                    user.password = fields.password;
                    user.avatar = avatar;
                    fs.readFile('./data.json',function(err,data){
                        var arr;
                        if(data==''){
                            arr = [];
                        }else{
                            arr=JSON.parse(data);
                        }
                        arr.push(user);
                        fs.writeFile('./data.json',JSON.stringify(arr));
                        res.statusCode=302;
                        res.setHeader("Location","./login.html");
                        res.end();
                    });
                });
            }else if(urlObj.pathname=='/login'){
                console.log(1000)



                var now = new Date().getTime();
                var info  = urlObj.query;

                    var username =  urlObj.query.split('&')[0].split('=')[1];
                    var password =  urlObj.query.split('&')[1].split('=')[1];
                    fs.readFile('./data.json',function(err,data){
                        var tempData = JSON.parse(data);
                        for(var i =0; i<tempData.length;i++){
                            var cur = tempData[i];
                            if(cur.name===username &&cur.password===password){
                                var sessionObj = {"username":username}
                                sessionObj.expTime=new Date(now+EXP_TIME);
                                var sessionID = uuid.v4()+now;
                                session[sessionID] = sessionObj;
                                res.writeHead(200,{
                                    "Content-Type":"text/html;charset=utf8",
                                    "set-cookie":key+"="+sessionID,

                                });

                                res.end('yes');
                            }

                        }
                        res.end('未找到');
                    })
            }
            else{
                if(fs.existsSync('.'+urlObj.pathname)){
                    res.setHeader('Content-Type',mime.lookup(urlObj.pathname));
                    fs.createReadStream('.'+urlObj.pathname).pipe(res);
                }
            }

    }

}).listen(8888,function(){
    console.log('start'+ 8888);
});