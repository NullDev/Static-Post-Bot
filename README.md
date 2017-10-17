# Static Post Bot

<p align="center">
<img height="150" width="auto" src="https://raw.githubusercontent.com/NLDev/Static-Post-Bot/master/.img/bot.gif" /><br>
Telegram Bot for making posts to a static website
</p>

<hr>

This was rather an test project for DOM Manipulation from NodeJS. <br>
Not suitable for production/deployment.

## How it works and what it does:

If you send the bot a message and you have permission to perform actions, you will be prompted with a menu where you can

- Create a new post
- List existing posts
- Delete a post
- Edit a post

Once an option is clicked, just follow the instructions of the bot. 

Posts consist of an image and a text. <br>
The pictures can be enlarged on click. 

Here is a demo to see what it looks like:

https://nldev.github.io/Static-Post-Bot/public_html/

## Install instructions: 

```javascript
//TODO
```

## Config:

The config is rather self explaining. <br>
It can be found [here](https://github.com/NLDev/Static-Post-Bot/blob/master/config.json).

| Option | Explanation |
|--------|-------------|
| telegram_token | Your Telegram-Bot API Key/Token |
| admins | Array of User ID's who are allowed to use the bot |
| path_to_html | Path to the HTML file where the posts will be applied to |
| allowed_image_types | Array of supported file extenson for images |
| markdown | Should all messages parsed as markdown? (E.g. Parse `*text*` as **text**) |
| everything after `markdown` | All other config entries are just the messages the bot sends. They can be customized. |

Thats it pretty much :smile_cat:

## Screenshots 
(click the pictures for full size)

<div align="center" style="display:flex; text-align:center;">
<img height="250" width="auto" src="https://raw.githubusercontent.com/NLDev/Static-Post-Bot/master/.img/scr1.png" />
<img height="250" width="auto" src="https://raw.githubusercontent.com/NLDev/Static-Post-Bot/master/.img/scr1.png" />
</div>
