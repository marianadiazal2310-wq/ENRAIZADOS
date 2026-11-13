
const router = require("express").Router();
const OpenAI = require("openai");
const Product = require("../models/Product");
const { demoProducts } = require("../utils/demoProducts");

router.post("/", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({ message: "Escribe una pregunta" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        message: "Falta configurar GROQ_API_KEY en .env"
      });
    }

    const db = await Product.find({ active: true })
      .limit(40).lean().catch(() => []);

    const catalog = (db.length ? db : demoProducts)
      .map(p => `${p.name}: ${p.description}. Material: ${p.material}. Precio: ${p.price} COP. Artesano: ${p.artisan}.`)
      .join("\n");

    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });

    const history = Array.isArray(req.body.history)
      ? req.body.history.slice(-8).map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: String(m.content || "").slice(0, 1500)
        }))
      : [];

    const result = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "Eres Raíz, asistente virtual de ENRAIZADOS, una plataforma comunitaria de artesanías tradicionales de Colombia. Responde en español, amablemente. Recomienda productos y explica materiales y comercio justo. Usa solo el catálogo para precios y disponibilidad. No inventes datos. No procesas pagos ni confirmas pedidos. Catálogo:\n" + catalog
        },
        ...history,
        { role: "user", content: message }
      ],
      max_tokens: 350
    });

    res.json({
      reply: result.choices[0]?.message?.content || "¿Puedes repetir tu pregunta?"
    });

  } catch (e) {
    console.error("GROQ:", e.status || "", e.message);
    res.status(502).json({
      message: "No se pudo consultar el asistente."
    });
  }
});

module.exports = router;
