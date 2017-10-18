"use strict";

var tg = require("node-telegram-bot-api");
var st = require("node-storage");
var rq = require("request");
var fs = require("fs");
var ch = require("fs-cheerio");

process.on("uncaughtException", function(err){ console.log((err && err.stack) ? err.stack : err); });

//user data storage
var store = new st("./userdata");

require.extensions[".json"] = function(module, filename){ module.exports = fs.readFileSync(filename, "utf8"); };
var raw = require("./config.json");
var con = JSON.parse(raw);

var token = con.bot.telegram_token,
    admin = con.bot.admins,
    relsr = con.bot.path_to_html,
    iexts = con.bot.allowed_image_types;

var perms = con.msg.no_permission,
    binfo = con.msg.info_text,
    about = con.msg.about_text,
    ntext = con.msg.create_post_text,
    ntcon = con.msg.create_post_text_confirm,
    npics = con.msg.create_post_picture,
    npcon = con.msg.create_post_picture_confirm,
    nncon = con.msg.create_post_confirm,
    ertxt = con.msg.invalid_text,
    erimg = con.msg.invalid_image_url,
    ertyp = con.msg.invalid_image_type,
    uerrs = con.msg.unknown_error,
    dtext = con.msg.delete_post,
    ntfnd = con.msg.post_not_found,
    dconf = con.msg.post_deleted;

var md = con.msg.markdown;

var nptxt = null,
    nppic = null;

var b = new tg(token, { polling: true });
console.log("Listening...");

function isset(_var) { return ((_var && _var != null && _var != "" ) ? true : false); }

function hasPerm(uid){ return (admin.indexOf(uid.toString()) > -1) ? true : false; } 

function isURL(str) {
    var pattern = new RegExp(
        '^(https?:\\/\\/)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))' +
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+&:]*)*(\\?[;&a-z\\d%_.,~+&:=-]*)?(\\#[-a-z\\d_]*)?$','i'
    );
    return pattern.test(str);
}

//converts an array to a nice text (example converts '["a","b","c"]' to 'a, b and c') 
function prettifyArr(arr){ 
    var x = arr.toString().replace(/\,/gi, ", ");
    var p = x.lastIndexOf(',');
    return x.substring(0, p) + " and" + x.substring(p + 1);
}

//download image to given folder
function dlImg(uri, dest, callback){
    rq(uri, { encoding: null }, function(error, response, body){
        fs.writeFile(dest, body, 'binary', function (err){ 
            if (err) console.error(err); 
            callback(err);
        });
    });
}

b.on("message", (msg) => {
    var txt = msg.text,
        uid = msg.from.id,
        key = uid.toString(),
        mid = msg.chat.id;

    //message send wrapper
    function send(text){ b.sendMessage(mid, text, { parse_mode: (md ? "markdown" : "") }); }

    //is the user in the middle of a process? (like entering a new post text)
    function main(){
        var userdata = store.get(key);
        isset(userdata) ? followProcess(userdata) : initMsg();
    }

    function followProcess(data){
        switch (data.toLowerCase()){
            case "newpost_text": {
                store.put(key, null);
                if (isset(txt)) nptxt = txt;
                else {
                    send(ertxt + "\n\n" + ntext);
                    store.put(key, 'newpost_text');
                    break;
                }
                newPostPicture(uid);
                break;
            }
            case "newpost_picture": {
                store.put(key, null);
                if (typeof msg.photo !== 'undefined' && msg.photo != null){
                    var fID = msg.photo[0].file_id;
                    var options = {
                        uri: "https:\/\/api.telegram.org\/bot" + token + "\/getFile?file_id=" + fID,
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    };
                    try {
                        rq(options, function(error, response, body){
                            var jsonraw = JSON.parse(body);
                            var fPath = jsonraw.result.file_path;
                            nppic = "https:\/\/api.telegram.org\/file\/bot" + token + "\/" + fPath;
                            newPostCall(nptxt, nppic, function(){ send(nncon); });
                        });
                    }
                    catch (err){ console.log(err); }
                }
                else if (isURL(txt)){
                    nppic = txt;
                    newPostCall(nptxt, nppic, function(){ send(nncon); });
                }  
                //wrong input: repeat
                else {
                    send(erimg + "\n\n" + npics);
                    store.put(key, 'newpost_picture');
                }
                break;
            }
            case "delete_post": {
                store.put(key, null);
                if (isNaN(txt) || txt <= 0) break;
                else {
                    ch.readFile(relsr).then(function($){
                        var count = $(".post").length;
                        var index = parseInt(txt) + 1;
                        if (txt > count) send(ntfnd);
                        else {
                            var imgpath = "./public_html/images/" + txt + "";
                            $("#post-" + txt).remove();
                            //fs.unlink(imgpath, function(err){ if (err) return console.log(err); });
                            send(dconf + "\n\nPost ID: " + txt);
                            //this will rearrange the remaining posts so there is a normal order again (1, 2, 3...)
                            for (index; index <= count; index++) $("#post-" + index).attr("id", "#post-" + (index - 1));
                            ch.writeFile(relsr, $);
                        }
                    });
                }
                break;
            }
        }
    }

    //Create new post call
    function newPostCall(nptxt, nppic, callback){
        //check if its a valid picture
        var ext = nppic.split(".").pop().toLowerCase();
        if (iexts.indexOf(ext) >= 0) {
            ch.readFile(relsr).then(function($){
                var count = $(".post").length;
                count++;
                var img = "./public_html/images/" + count + "." + ext;
                var src = "./images/" + count + "." + ext;
                dlImg(nppic, img, function(err){ if (err) send(uerrs); });
                send(npcon);
                $(".posts").append(
                    "<div class=\"post\" id=\"post-" + count + "\">\n" + 
                    "   <div class=\"post-image\">\n" +
                    "       <img class=\"bigimg\" src=\"" + src + "\" />\n" +
                    "   </div>\n" +
                    "   <div class=\"post-text\">\n" +
                    "       <p>" + nptxt + "</p>\n" +
                    "   </div>\n" + 
                    "</div>\n"
                );
                ch.writeFile(relsr, $);
            });
            callback();
        }
        else {
            send(ertyp + "\n\nAllowed image types: " + prettifyArr(iexts) + "\nYour image: " + ext + "\n\n" + npics);
            store.put(key, 'newpost_picture');
            return;
        }
    }

    //choice menu
    function initMsg(){
        //telegram buttons
        b.sendMessage(mid, binfo, {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: "New Post",
                        callback_data: "new_post"
                    }],
                    [{
                        text: "List Posts",
                        callback_data: "list_post"
                    }],
                    [{
                        text: "Delete Post",
                        callback_data: "delete_post"
                    }],
                    [{
                        text: "Edit Posts",
                        callback_data: "edit_post"
                    }],
                    [
                        {
                            text: "About",
                            callback_data: "about_text"
                        },
                        {
                            text: "Source Code",
                            callback_data: "source_code"
                        }
                    ]
                ]
            },
            //is markdown enabled in the config?
            parse_mode: (md ? "markdown" : "")
        }).then(function(x) {
            //process input
            b.on("callback_query", (callbackQuery) => {
                //always check permissions; button could be old!
                switch (callbackQuery.data){
                    case "new_post": {
                        hasPerm(uid) ? newPostText() : deny();
                        break;
                    }
                    case "list_post": {
                        hasPerm(uid) ? listPost() : deny();
                        break;
                    }
                    case "delete_post": {
                        hasPerm(uid) ? deletePost() : deny();
                        break;
                    }
                    case "edit_post": {
                        hasPerm(uid) ? editPost() : deny();
                        break;
                    }
                    case "about_text": {
                        send(about);
                        break;
                    },
                    case "source_code": {
                        send("https://github.com/NLDev/Static-Post-Bot");
                        break;
                    }
                }
                b.answerCallbackQuery(callbackQuery.id, null);
                callbackQuery = null;
            });
        }).catch(console.error);
    }

    function deny(){ send(perms + "\n\nYour User ID is: " + uid) }

    function newPostText(){
        send(ntext);
        store.put(key, 'newpost_text');
    }

    function newPostPicture(){
        send(ntcon + "\n\n" + npics);
        store.put(key, 'newpost_picture');
    }

    function listPost(uid){

    }

    function deletePost(){
        send(dtext);
        store.put(key, 'delete_post');
    }

    function editPost(uid){

    }

    //check user permissions and either deny or allow him to proceed
    hasPerm(uid) ? main() : deny();
});
