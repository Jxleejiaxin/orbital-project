import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { Markup, Telegraf } from "telegraf";
import app from "../src/firebase.js";

const TOKEN = "5345883223:AAHVpuSSGZuOYdYImzakATNYi4tXw_Kyd_0";
const bot = new Telegraf(TOKEN);
const db = getFirestore(app);

//state of order in group chats
let currentOrder = {
  active: false,
  owner: null,
  token: "",
};

bot.start((ctx) => {
  if (ctx.message.chat.type === "private") {
    ctx.reply(
      `Hi! ${ctx.from.first_name} 👋 \n \n Type /startneworder in your desired group to begin!`,
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
  }
});

bot.command("startneworder", async (ctx) => {
  console.log(currentOrder.active);
  if (currentOrder.active) {
    ctx.reply("There is an ongoing order! Please send /resetorder to start a new order.");
    return false;
  }
  if (ctx.message.chat.type === "private") {
    ctx.reply("This is only available in group chats");
    return false;
  }
  currentOrder.active = true;
  currentOrder.owner = ctx.from.id;
  currentOrder.token = await generateToken(4);
  await setDoc(doc(db,"tokens",currentOrder.token), {
    status: "open",
    //users: [],
    cart: []
  })
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

//bot.command("currentorder", (ctx) => {
  //displays list of orders and total price
  //return;
//});
bot.command("token", (ctx) => {
  ctx.reply(`${currentOrder.token}`);
})

bot.command("help", (ctx) => {});

bot.command("resetorder", async (ctx) => {
  if (ctx.from.id !== currentOrder.owner) {
    ctx.reply("You are not the creator of the order!");
    return false;
  } else {
    console.log(currentOrder.token);
    const currentOrderRef = getDoc(doc(db, "orders", currentOrder.token));
    //deleteCollection(db, currentOrderRef, 1);
    resetOrder();
    ctx.reply("Order cleared, start new order by sending /startneworder");
  }
});

bot.command("forcereset", (ctx) => {
  resetOrder();
  const currentOrderRef = doc(db, "orders", currentOrder.token);
  //deleteCollection(db, currentOrderRef, 1);
  ctx.reply("Order cleared, start new order by sending /startneworder");
})

//test command to addfood
bot.command("addfood", (ctx) => {
  const foodRef = doc(db, "orders", currentOrder.token, "users", ctx.from.id);
  setDoc(foodRef, [
    {title:"chicken", price:4.50, quantity:1},
    {title:"nasi lemak", price:3.50, quantity:2}
  ])
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

async function deleteCollection(db, collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}
