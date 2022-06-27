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

const TOKEN = "YOUR_BOT_TOKEN";
const bot = new Telegraf(TOKEN);
const db = getFirestore(app);

bot.start( async (ctx) => {
  if (ctx.message.chat.type === "private") {
    ctx.reply("Hi");
    return false;
  } else {
    const chat_id = ctx.message.chat.id;
    console.log(chat_id);
    const groupRef = doc(db, "groups", `${chat_id}`);
    const groupSnap = await(getDoc(groupRef));
    if (groupSnap.exists()) {
      ctx.reply("You only need to /start once!");
    } else {
      //state of order in the group chat
      //status can be inactive, active, closed, payment
      await setDoc(groupRef, {
      status: "inactive",
      owner: null,
      ownerName: null,
      token: "not generated yet.",
      });
      ctx.reply("Hi! Send /startneworder to start ordering!")
    }
  } 
});

bot.command("startneworder", async (ctx) => {
  const orderSnap = await getDoc(doc(db,"groups",`${ctx.message.chat.id}`));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!")
    return false;
  } else {
    const currentOrder = orderSnap.data();
    const tempToken = await generateToken(4);
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
    await updateDoc(doc(db,"groups",`${ctx.message.chat.id}`), {
      status: "active",
      owner: ctx.from.id,
      ownerName: ctx.from.first_name,
      token: tempToken
    })      
    await setDoc(doc(db, "tokens", tempToken), {
      status: "open",
      cart: [],
    });
    ctx.reply(
      `Order started! Proceed to the webapp and input ${tempToken} to join!`,
      Markup.inlineKeyboard(
        [
          Markup.button.url(
            "WebApp",
            "https://payleh-bot.netlify.app/"
          ),
        ],
        { columns: 1 }
      )
    );
  }
  
});

bot.command("closeorder", async (ctx) => {
  const orderSnap = await (getDoc(doc(db,"groups",`${ctx.message.chat.id}`)));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!")
    return false;
  } else {
    const currentOrder = orderSnap.data();
    if (currentOrder.status === "active" && ctx.from.id === currentOrder.owner) {
      await updateDoc(doc(db, "tokens", currentOrder.token), {
        status: "closed",
      });
      await updateDoc(doc(db,"groups",`${ctx.message.chat.id}`), {
        status: "closed"
      });
      ctx.reply("Order closed.");
    } else if (currentOrder.status === "payment") {
      ctx.reply("Payment in progress. Order cannot be open/closed.");
    } else {
      ctx.reply(
        "Please be the order creator or have an order created to invoke this command."
      );
    }
  }
});

bot.command("openorder", async (ctx) => {
  const orderSnap = await (getDoc(doc(db,"groups",`${ctx.message.chat.id}`)));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!")
    return false;
  } else {
    const currentOrder = orderSnap.data();
    if (currentOrder.status === "closed" && ctx.from.id === currentOrder.owner) {
      await updateDoc(doc(db, "tokens", currentOrder.token), {
        status: "open",
      });
      await updateDoc(doc(db,"groups",`${ctx.message.chat.id}`), {
        status:"active"
      });
      ctx.reply(
        `Order open! Proceed to the webapp and input ${currentOrder.token} to join!`,
        Markup.inlineKeyboard(
          [
            Markup.button.url(
              "WebApp",
              "https://payleh-bot.netlify.app/"
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
  }
});

let timer = null;

//sets bot order status to payment
bot.command("confirmorder", async (ctx) => {
  const orderSnap = await getDoc(doc(db,"groups",`${ctx.message.chat.id}`));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!")
    return false;
  } else {
    const currentOrder = orderSnap.data();
    if (ctx.from.id !== currentOrder.owner) {
      ctx.reply(
        "Please be the order creator or have an order created to invoke this command."
      );
      return;
    }
    const menuRef = doc(db,"tokens",currentOrder.token);
    const menuSnap = await getDoc(menuRef);
    if (!menuSnap.exists()) {
      ctx.reply("Please add items to order first!");
      return;
    }
    if (currentOrder.status === "active" || currentOrder.status === "closed") {
      var orderString = `Please pay @${currentOrder.ownerName} as follows: \n`;
      var collatedString = 'Collated orders: \n';
      var collatedOrder = [];
      await updateDoc(doc(db, "tokens", currentOrder.token), {
        status: "closed",
      });
      const userSnapshot = await getDocs(
        collection(db, "tokens", currentOrder.token, "users")
      );
      userSnapshot.forEach((doc) => {
        orderString += `@${doc.id}: `;
        const cartItems = doc.data().cart;
        cartItems.forEach((item) => {
          orderString += `${item.quantity}x ${item.title} `;
          const exist = collatedOrder.findIndex((x) => x.title === item.title);
          if (exist !== -1) {
            collatedOrder[exist].quantity += item.quantity;
          } else {
            collatedOrder.push({title:item.title,quantity:item.quantity})
          }
        })
        const totalPrice = cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        orderString += `$${totalPrice} \r\n`;
      });

      collatedOrder.forEach((item) => {
        collatedString += `${item.quantity}x ${item.title} \r\n`
      })
      await updateDoc(doc(db,"groups",`${ctx.message.chat.id}`), {
        status:"payment"
      });
      orderString += "\r\n"+ collatedString;
      const poll = await ctx.replyWithPoll(orderString, ['Paid', 'Did not order'], {is_anonymous: false});
      timer = setInterval(() => {
        ctx.telegram.forwardMessage(ctx.message.chat.id, ctx.message.chat.id, poll.message_id);
        ctx.reply(`Please send /paid if all payments to ${currentOrder.ownerName} is done`)
        }, 
        (1000 * 15)
      );
    } else {
      ctx.reply("No order to confirm/payment in progress.");
    }
  }
});

//sets order status to inactive, deletes current order in database
//TBD: adds cart to respective telegram handle in database
bot.command("paid", async (ctx) => {
  const orderSnap = await (getDoc(doc(db,"groups",`${ctx.message.chat.id}`)));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!")
    return false;
  } else {
    const currentOrder = orderSnap.data();
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
      await setDoc(doc(db,"groups", `${ctx.message.chat.id}`), {
        status:"inactive",
        owner: null,
        ownerName: null,
        token: "not generated yet.",
  
      })
      ctx.reply("Payment acknowledged.")
    } else {
      ctx.reply("The order has not moved to payment status yet. Please /confirmorder first");
    }
  }
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
  const orderSnap = await (getDoc(doc(db,"groups",`${ctx.message.chat.id}`)));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!")
    return false;
  } else {
    const currentOrder = orderSnap.data();
  if (ctx.from.id !== currentOrder.owner) {
    ctx.reply("No order active or you are not the creator of the order! Send /forcereset if necessary.");
    return;
  } else if (currentOrder.status === "payment") {
    ctx.reply("Payment is still pending. Please send /paid to complete the order process.");
    return;
  } else {
    const userSnapshot = await getDocs(
      collection(db, "tokens", currentOrder.token, "users")
    );
    userSnapshot.forEach((cart) => {
      deleteDoc(doc(db,"tokens",currentOrder.token,"users",cart.id));
    })
    await deleteDoc(doc(db,"tokens",currentOrder.token));
    await setDoc(doc(db,"groups", `${ctx.message.chat.id}`), {
      status:"inactive",
      owner: null,
      ownerName: null,
      token: "not generated yet.",

    })
    ctx.reply("Order cleared, start new order by sending /startneworder");
    return;
  }
}
});

//ignores bot order status and resets
bot.command("forcereset", async (ctx) => {
  const orderSnap = await getDoc(doc(db,"groups",`${ctx.message.chat.id}`));
  if (!orderSnap.exists()) {
    ctx.reply("Please send /start first!")
    return false;
  } else {
    const currentOrder = orderSnap.data();
    clearInterval(timer);
    const userSnapshot = await getDocs(
    collection(db, "tokens", currentOrder.token, "users")
  );
  userSnapshot.forEach((cart) => {
    deleteDoc(doc(db,"tokens",currentOrder.token,"users",cart.id));
  })
  await deleteDoc(doc(db,"tokens", currentOrder.token));
  await setDoc(doc(db,"groups", `${ctx.message.chat.id}`), {
    status:"inactive",
    owner: null,
    ownerName: null,
    token: "not generated yet.",

  })
  ctx.reply("Order cleared, start new order by sending /startneworder");

}});

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


