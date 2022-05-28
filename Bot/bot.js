const {Markup, Telegraf} = require("telegraf");
const TOKEN = "your_telegram_bot_token";
const bot = new Telegraf(TOKEN);

const web_link = "https://fanciful-dusk-4693ed.netlify.app/";


bot.start((ctx) =>
    ctx.reply(
    `Hi! ${ctx.from.first_name} 👋 \n \n Shall we start ordering? 👇 `,
    Markup.inlineKeyboard(
      [Markup.button.url(
          "WebApp",
          "https://fanciful-dusk-4693ed.netlify.app/"
        )
      ],
      { columns: 1 }
    )
  ));

bot.command('createorder', (ctx)=>
    ctx.reply('start ordering', 
    Markup.keyboard([
        Markup.button.pollRequest('Add menu', 'regular')
    ])))

bot.launch()
