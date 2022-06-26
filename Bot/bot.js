import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { Markup, Telegraf } from "telegraf";
import app from "../src/firebase.js";

const TOKEN = "YOUR_BOT_TOKEN";
const bot = new Telegraf(TOKEN);
const db = getFirestore(app);

//state of order in the group chat
//status can be inactive, active, closed, payment
let currentOrder = {
  status: "inactive",
  owner: null,
  ownerName: null,
  token: "",
};

bot.start((ctx) => {
  if (ctx.message.chat.type === "private") {
    ctx.reply(
      `Hi! ${ctx.from.first_name} 👋 \n \n Type /startneworder in your desired group to begin!`
    );
  }
});

bot.command("startneworder", async (ctx) => {
  if (currentOrder.status === "active" || currentOrder.status === "closed") {
    ctx.reply(
      "There is an ongoing order! Please send /resetorder to start a new order."
    );
    return false;
  }
  if (currentOrder.status === "payment") {
    ctx.reply(
      "Order payment is currently in progress. Send /paid if all payments are done"
    );
    return false;
  }
  if (ctx.message.chat.type === "private") {
    ctx.reply("This is only available in group chats");
    return false;
  }
  currentOrder.status = "active";
  currentOrder.owner = ctx.from.id;
  currentOrder.ownerName = ctx.from.first_name;
  currentOrder.token = await generateToken(4);
  await setDoc(doc(db, "tokens", currentOrder.token), {
    status: "open",
    cart: [],
  });
  ctx.reply(
    `Order started! Proceed to the webapp and input ${currentOrder.token} to join!`,
    Markup.inlineKeyboard(
      [
        Markup.button.url(
          "WebApp",
          "https://fanciful-dusk-4693ed.netlify.app/"
        ),
      ],
      { columns: 1 }
    )
  );
});

bot.command("closeorder", async (ctx) => {
  if (currentOrder.status === "active" && ctx.from.id === currentOrder.owner) {
    await updateDoc(doc(db, "tokens", currentOrder.token), {
      status: "closed",
    });
    currentOrder.status = "closed";
    ctx.reply("Order closed.");
  } else if (currentOrder.status === "payment") {
    ctx.reply("Payment in progress. Order cannot be open/closed.");
  } else {
    ctx.reply(
      "Please be the order creator or have an order created to invoke this command."
    );
  }
});

bot.command("openorder", async (ctx) => {
  if (currentOrder.status === "closed" && ctx.from.id === currentOrder.owner) {
    await updateDoc(doc(db, "tokens", currentOrder.token), {
      status: "open",
    });
    currentOrder.status = "active";
    ctx.reply(
      `Order open! Proceed to the webapp and input ${currentOrder.token} to join!`,
      Markup.inlineKeyboard(
        [
          Markup.button.url(
            "WebApp",
            "https://fanciful-dusk-4693ed.netlify.app/"
          ),
        ],
        { columns: 1 }
      )
    );
  } else if (currentOrder.status === "payment") {
    ctx.reply("Payment in progress. Order cannot be open/closed.");
  } else {
    ctx.reply(
      "Please be the order creator or have an order created to invoke this command."
    );
  }
});

let timer = null;

//sets bot order status to payment
bot.command("confirmorder", async (ctx) => {
  if (currentOrder.status === "active" || currentOrder.status === "closed") {
    var orderString = `Please pay @${currentOrder.ownerName} as follows: \n`;
    const userSnapshot = await getDocs(
      collection(db, "tokens", currentOrder.token, "users")
    );
    userSnapshot.forEach((doc) => {
      orderString += "@"+doc.id + " : $";
      const cartItems = doc.data().cart;
      const totalPrice = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      orderString += totalPrice + "\n";
    });
    currentOrder.status = "payment";
    const poll = await ctx.replyWithPoll(orderString, ['Paid', 'Did not order'], {is_anonymous: false});
    timer = setInterval(() => {
      ctx.telegram.forwardMessage(ctx.message.chat.id, ctx.message.chat.id, poll.message_id);
      ctx.reply(`Please send /paid if all payments to ${currentOrder.ownerName} is done`)
      }, 
      (1000)
    );
  } else {
    ctx.reply("No order to confirm/payment in progress.");
  }
});

//sets order status to inactive, deletes current order in database
//TBD: adds cart to respective telegram handle in database
bot.command("paid", async (ctx) => {
  if (ctx.from.id !== currentOrder.owner) {
    ctx.reply(
      "No order active or you are not the creator of the order! Send /forcereset if necessary."
    );
    return false;
  } else if (currentOrder.status === "payment") {
    clearInterval(timer);
    const userSnapshot = await getDocs(
      collection(db, "tokens", currentOrder.token, "users")
    );
    userSnapshot.forEach((cart) => {
      deleteDoc(doc(db,"tokens",currentOrder.token,"users",cart.id));
    })
    await deleteDoc(doc(db,"tokens",currentOrder.token));
    resetOrder();
    ctx.reply("Payment acknowledged.")
  } else {
    ctx.reply("The order has not moved to payment status yet.");
  }
});

bot.command("token", (ctx) => {
  ctx.reply(`${currentOrder.token}`);
});

//display all commands
bot.command("help", (ctx) => {
  ctx.reply(`PayLeh! bot commands: 
  /startneworder starts a new order
  /closeorder closes the order temporarily
  /openorder reopens a closed order
  /confirmorder finalizes the order and it can no longer be reopened
  /paid indicates payment is done and a new order can be placed
  /resetorder resets the current order. This cannot be done during payment process
  Happy ordering!
  `);
});

bot.command("resetorder", async (ctx) => {
  if (ctx.from.id !== currentOrder.owner) {
    ctx.reply(
      "No order active or you are not the creator of the order! Send /forcereset if necessary."
    );
    return false;
  } else if (currentOrder.status === "payment") {
    ctx.reply("Payment is still pending. Please send /paid to complete the order process.")
  } else {
    const userSnapshot = await getDocs(
      collection(db, "tokens", currentOrder.token, "users")
    );
    userSnapshot.forEach((cart) => {
      deleteDoc(doc(db,"tokens",currentOrder.token,"users",cart.id));
    })
    await deleteDoc(doc(db,"tokens",currentOrder.token));
    resetOrder();
    ctx.reply("Order cleared, start new order by sending /startneworder");
  }
});

//ignores bot order status and resets
bot.command("forcereset", async (ctx) => {
  const userSnapshot = await getDocs(
    collection(db, "tokens", currentOrder.token, "users")
  );
  userSnapshot.forEach((cart) => {
    deleteDoc(doc(db,"tokens",currentOrder.token,"users",cart.id));
  })
  await deleteDoc(doc(db,"tokens",currentOrder.token));
  resetOrder();
  ctx.reply("Order cleared, start new order by sending /startneworder");
});

bot.launch();

const generateToken = async (n) => {
  var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var token = "";
  for (var i = 0; i < n; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  let tokenCheck = await getDoc(doc(db, "orders", token)).then((tokenSnap) => {
    if (tokenSnap.exists()) {
      return generateToken(n);
    } else {
      return token;
    }
  });
  return tokenCheck;
};

const resetOrder = () => {
  currentOrder = {
    active: false,
    owner: null,
    token: "",
  };
};

