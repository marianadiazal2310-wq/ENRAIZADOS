require("dotenv").config();
const express=require("express"),cors=require("cors"),path=require("path");
const connectDB=require("./config/db"),{ensureAdmin}=require("./utils/seedAdmin");
const app=express();
app.use(cors({origin:process.env.CLIENT_URL||"http://localhost:5173"}));
app.use(express.json({limit:"1mb"}));
app.get("/api/health",(_req,res)=>res.json({status:"ok",service:"ENRAIZADOS API"}));
app.use("/api/products",require("./routes/products"));
app.use("/api/contact",require("./routes/contact"));
app.use("/api/assistant",require("./routes/assistant"));
app.use("/api/auth",require("./routes/auth"));
if(process.env.NODE_ENV==="production"){app.use(express.static(path.join(__dirname,"..","dist")));app.get("*",(_req,res)=>res.sendFile(path.join(__dirname,"..","dist","index.html")));}
const PORT=process.env.PORT||5000;
connectDB().then(async()=>{await ensureAdmin();app.listen(PORT,()=>console.log(`ENRAIZADOS API en http://localhost:${PORT}`));}).catch(e=>{console.error("No se pudo iniciar MongoDB:",e.message);process.exit(1);});