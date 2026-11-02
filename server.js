import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

app.post("/api/answer", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "يرجى إرسال السؤال." });
    }

    const instructions = `
أنت مساعد تعليمي للمناهج العراقية للمرحلة المتوسطة.
أجب باللغة العربية وبأسلوب الكتاب المدرسي العراقي.
لا تخترع معلومات أو تنسبها للكتاب دون تحقق.
إذا لم تستطع تأكيد المعلومة من الكتاب، وضح ذلك صراحة.
السؤال:
${prompt}
`;

    const results = [];

    // ChatGPT
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const response = await openai.responses.create({
        model: "gpt-5.4-mini",
        input: instructions
      });

      results.push(response.output_text);
    }

    // Gemini
    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
      );

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
      });

      const response = await model.generateContent(instructions);

      results.push(response.response.text());
    }

    if (!results.length) {
      throw new Error("لم تتم إضافة مفاتيح الذكاء الاصطناعي.");
    }

    res.json({
      answer: results.join("\n\n---\n\n")
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "تعذر إنشاء الإجابة: " + error.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("Miran Server is running");
});

app.listen(PORT, () => {
  console.log("Miran server running on port " + PORT);
});
