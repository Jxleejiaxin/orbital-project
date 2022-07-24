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
import app from "./firebase.js";

const TOKEN = "BOT_TOKEN";
const bot = new Telegraf(TOKEN);
const db = getFirestore(app);
const timerArray = [];

bot.start(async (ctx) => {
  if (ctx.message.chat.type === "private") {
    ctx.reply("Hi! Please add this bot to group chats and send /start to initiate the bot. Send /help to see the commands for this bot.");
    return false;
  } else {
    const chat_id = ctx.message.chat.id;
    console.log(chat_id);
    const groupRef = doc(db, "groups", `${chat_id}`);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) {
      ctx.reply("You only need to /start once!");
    } else {
      //state of order in the group chat
      //status can be inactive, active, closed, payment
      await setDoc(groupRef, {
        status: "inactive",
        orderTimeStamp: null,
        owner: null,
        ownerName: null,
        token: "not generated yet.",
      });
      ctx.reply("Hi! Send /help to see the commands for this bot!");
    }
  }
});

bot.command("startorder", async (ctx) => {
  if (ctx.message.chat.type === "private") {
    ctx.reply("Hi! Please use this bot in group chats.");
    return false;
  }
  const orderSnap = await getDoc(doc(db, "groups", `${ctx.message.chat.id}`));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!");
    return false;
  } else {
    const currentOrder = orderSnap.data();
    if (currentOrder.status === "active" || currentOrder.status === "closed") {
      ctx.replyWithMarkdown(`Order ongoing! Click \`${currentOrder.token}\` to copy the token!`);
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
    const tempToken = await generateToken(4);
    await updateDoc(doc(db, "groups", `${ctx.message.chat.id}`), {
      status: "active",
      orderTimeStamp: ctx.message.date,
      owner: ctx.from.id,
      ownerName: ctx.from.first_name,
      token: tempToken,
    });
    await setDoc(doc(db, "tokens", tempToken), {
      status: "open",
      cart: [],
    });
    await ctx.replyWithMarkdown(`Click \`${tempToken}\` to copy the token!`);
    ctx.reply(
      `Order started! Proceed to the webapp and input ${tempToken} to join!`,
      Markup.inlineKeyboard(
        [Markup.button.url("WebApp", "https://payleh-bot.netlify.app/")],
        { columns: 1 }
      )
    );    
  }
});

bot.command("pause", async (ctx) => {
  if (ctx.message.chat.type === "private") {
    ctx.reply("Hi! Please use this bot in group chats.");
    return false;
  }
  const orderSnap = await getDoc(doc(db, "groups", `${ctx.message.chat.id}`));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!");
    return false;
  } else {
    const currentOrder = orderSnap.data();
    if (
      currentOrder.status === "active" &&
      ctx.from.id === currentOrder.owner
    ) {
      await updateDoc(doc(db, "tokens", currentOrder.token), {
        status: "closed",
      });
      await updateDoc(doc(db, "groups", `${ctx.message.chat.id}`), {
        status: "closed",
      });
      ctx.reply("Order closed temporarily.");
    } else if (currentOrder.status === "payment") {
      ctx.reply("Payment in progress. Order cannot be paused/resumed.");
    } else {
      ctx.reply(
        "Please be the order creator or have an open order created to invoke this command."
      );
    }
  }
});

bot.command("resume", async (ctx) => {
  if (ctx.message.chat.type === "private") {
    ctx.reply("Hi! Please use this bot in group chats.");
    return false;
  }
  const orderSnap = await getDoc(doc(db, "groups", `${ctx.message.chat.id}`));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!");
    return false;
  } else {
    const currentOrder = orderSnap.data();
    if (
      currentOrder.status === "closed" &&
      ctx.from.id === currentOrder.owner
    ) {
      await updateDoc(doc(db, "tokens", currentOrder.token), {
        status: "open",
      });
      await updateDoc(doc(db, "groups", `${ctx.message.chat.id}`), {
        status: "active",
      });
      ctx.reply(
        `Order open! Proceed to the webapp and input ${currentOrder.token} to join!`,
        Markup.inlineKeyboard(
          [Markup.button.url("WebApp", "https://payleh-bot.netlify.app/")],
          { columns: 1 }
        )
      );
    } else if (currentOrder.status === "payment") {
      ctx.reply("Payment in progress. Order cannot be paused/resumed.");
    } else {
      ctx.reply(
        "Please be the order creator or have a closed order created to invoke this command."
      );
    }
  }
});

let timer = null;

//sets bot order status to payment
bot.command("confirm", async (ctx) => {
  if (ctx.message.chat.type === "private") {
    ctx.reply("Hi! Please use this bot in group chats.");
    return false;
  }
  const orderSnap = await getDoc(doc(db, "groups", `${ctx.message.chat.id}`));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!");
    return false;
  } else {
    const currentOrder = orderSnap.data();
    if (ctx.from.id !== currentOrder.owner) {
      ctx.reply(
        "Please be the order creator or have an order created to invoke this command."
      );
      return;
    }
    const menuRef = doc(db, "tokens", currentOrder.token);
    const menuSnap = await getDoc(menuRef);
    if (!menuSnap.exists()) {
      ctx.reply("Please add items to order first!");
      return;
    }
    if (currentOrder.status === "active" || currentOrder.status === "closed") {
      var orderString = `Please pay ${currentOrder.ownerName} as follows: \n`;
      var collatedString = "Collated orders: \n";
      var collatedOrder = [];
      
      const userSnapshot = await getDocs(
        collection(db, "tokens", currentOrder.token, "users")
      );
      userSnapshot.forEach((doc) => {
        orderString += `@${doc.id} : `;
        const cartItems = doc.data().cart;
        cartItems.forEach((item) => {
          orderString += `${item.quantity}x ${item.title} `;
          const exist = collatedOrder.findIndex((x) => x.title === item.title);
          if (exist !== -1) {
            collatedOrder[exist].quantity += item.quantity;
          } else {
            collatedOrder.push({ title: item.title, quantity: item.quantity });
          }
        });
        const totalPrice = cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        orderString += `$${totalPrice} \r\n`;
      });
      if (collatedOrder.length === 0) {
        ctx.reply(
          `No orders found! Proceed to the webapp and input ${currentOrder.token} to join!`,
          Markup.inlineKeyboard(
            [Markup.button.url("WebApp", "https://payleh-bot.netlify.app/")],
            { columns: 1 }
          )
        );
        return false;
      }
      await updateDoc(doc(db, "tokens", currentOrder.token), {
        status: "closed",
      });
      collatedOrder.forEach((item) => {
        collatedString += `${item.quantity}x ${item.title} \r\n`;
      });
      await updateDoc(doc(db, "groups", `${ctx.message.chat.id}`), {
        status: "payment",
      });
      await ctx.reply(collatedString);
      await ctx.reply(orderString);
      const poll = await ctx.replyWithPoll(
        "Please indicate if you have paid here",
        ["Paid", "Did not order"],
        { is_anonymous: false }
      );
      timer = setInterval(async () => {
        await ctx.reply(orderString);
        await ctx.telegram.forwardMessage(
          ctx.message.chat.id,
          ctx.message.chat.id,
          poll.message_id
        );
        await ctx.reply(
          `Please send /paid if all payments to ${currentOrder.ownerName} is done`
        );
      }, 1000 * 60 * 60 * 24);
      timerArray.push({ id: ctx.message.chat.id, timer: timer });
    } else {
      ctx.reply("No order to confirm/payment in progress.");
    }
  }
});

//sets order status to inactive, deletes current order in database
//TBD: adds cart to respective telegram handle in database
bot.command("paid", async (ctx) => {
  if (ctx.message.chat.type === "private") {
    ctx.reply("Hi! Please use this bot in group chats.");
    return false;
  }
  const orderSnap = await getDoc(doc(db, "groups", `${ctx.message.chat.id}`));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!");
    return false;
  } else {
    const currentOrder = orderSnap.data();
    if (ctx.from.id !== currentOrder.owner) {
      ctx.reply(
        "No order active or you are not the creator of the order! Send /forcereset if necessary."
      );
      return false;
    } else if (currentOrder.status === "payment") {
      ctx.reply("Please wait...");
      const exist = timerArray.find((x) => x.id === ctx.message.chat.id);
      if (exist) {
        clearInterval(exist.timer);
      }
      const userSnapshot = await getDocs(
        collection(db, "tokens", currentOrder.token, "users")
      );
      const dateString = await unixToString(currentOrder.orderTimeStamp);
      userSnapshot.forEach(async (cartSnap) => {
        if (cartSnap.data().save) {
          const historyRef = doc(
            db,
            "user email",
            cartSnap.data().email,
            "history",
            dateString
          );
          await setDoc(historyRef, {
            owner: currentOrder.ownerName,
            cart: cartSnap.data().cart,
          });
        }
        await deleteDoc(
          doc(db, "tokens", currentOrder.token, "users", cartSnap.id)
        );
      });
      await deleteDoc(doc(db, "tokens", currentOrder.token));
      await setDoc(doc(db, "groups", `${ctx.message.chat.id}`), {
        status: "inactive",
        orderTimeStamp: null,
        owner: null,
        ownerName: null,
        token: "not generated yet.",
      });
      ctx.reply("Payment acknowledged.");
    } else {
      ctx.reply(
        "The order has not moved to payment status yet. Please /confirm order first"
      );
    }
  }
});

//display all commands
bot.command("help", (ctx) => {
  ctx.reply(`PayLeh! bot commands: 
  /startorder starts a new order, input the token into our webapp to start!
  /pause closes the order temporarily
  /resume reopens a paused order
  /confirm finalizes the order and it can no longer be reopened. 
  Use this when you have already paid for the order.
  Also sets a 24-hour reminder to pay for your order
  /paid indicates payment is done and a new order can be placed
  /reset resets the current order. This cannot be done during payment process
  Happy ordering!
  `);
});

bot.command("reset", async (ctx) => {
  if (ctx.message.chat.type === "private") {
    ctx.reply("Hi! Please use this bot in group chats.");
    return false;
  }
  const orderSnap = await getDoc(doc(db, "groups", `${ctx.message.chat.id}`));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!");
    return false;
  } else {
    const currentOrder = orderSnap.data();
    if (ctx.from.id !== currentOrder.owner) {
      ctx.reply(
        "No order active or you are not the creator of the order! Send /forcereset if necessary."
      );
      return;
    } else if (currentOrder.status === "payment") {
      ctx.reply(
        "Payment is still pending. Please send /paid to complete the order process."
      );
      return;
    } else {
      const userSnapshot = await getDocs(
        collection(db, "tokens", currentOrder.token, "users")
      );
      userSnapshot.forEach(async (cart) => {
        await deleteDoc(
          doc(db, "tokens", currentOrder.token, "users", cart.id)
        );
      });
      await deleteDoc(doc(db, "tokens", currentOrder.token));
      await setDoc(doc(db, "groups", `${ctx.message.chat.id}`), {
        status: "inactive",
        owner: null,
        ownerName: null,
        token: "not generated yet.",
      });
      ctx.reply("Order cleared, start new order by sending /startorder");
      return;
    }
  }
});

//ignores bot order status and resets
bot.command("forcereset", async (ctx) => {
  if (ctx.message.chat.type === "private") {
    ctx.reply("Hi! Please use this bot in group chats.");
    return false;
  }
  const orderSnap = await getDoc(doc(db, "groups", `${ctx.message.chat.id}`));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!");
    return false;
  } else {
    const currentOrder = orderSnap.data();
    const exist = timerArray.find((x) => x.id === ctx.message.chat.id);
    if (exist) {
      clearInterval(exist.timer);
    }
    const userSnapshot = await getDocs(
      collection(db, "tokens", currentOrder.token, "users")
    );
    userSnapshot.forEach(async (cart) => {
      await deleteDoc(doc(db, "tokens", currentOrder.token, "users", cart.id));
    });
    await deleteDoc(doc(db, "tokens", currentOrder.token));
    await setDoc(doc(db, "groups", `${ctx.message.chat.id}`), {
      status: "inactive",
      owner: null,
      ownerName: null,
      token: "not generated yet.",
    });
    ctx.reply("Order cleared, start new order by sending /startorder");
  }
});

bot.launch();

//helper functions

const generateToken = async (n) => {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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

const unixToString = async (unixTimeStamp) => {
  const date = new Date(unixTimeStamp * 1000);
  const month = date.toLocaleString("en-SG", { month: "long" });
  const day = date.toLocaleString("en-SG", { day: "numeric" });
  const year = date.toLocaleString("en-SG", { year: "numeric" });
  const time = date.toLocaleTimeString("en-SG");
  const formattedDate = `${day} ${month} ${year} ${time}`;
  return formattedDate;
};
