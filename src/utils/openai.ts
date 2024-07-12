import { SheetData } from "@/types/SheetData";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to count tokens
function countTokens(text: string): number {
  const tokens = text.split(/\s+/);
  return tokens.length;
}

async function getAIVerdicts(
  candidatesInfo: string
): Promise<{ verdicts: string[]; justifications: string[] }> {
  try {
    const prompt = `Оцените следующих кандидатов и дайте вердикт "Подходит" или "Не подходит" для каждого, а также краткое обоснование:

${candidatesInfo}

Пожалуйста, предоставьте ваши вердикты и обоснования в следующем формате:
1. Вердикт: [Подходит/Не подходит]
   Обоснование: [Краткое обоснование]
2. Вердикт: [Подходит/Не подходит]
   Обоснование: [Краткое обоснование]
...`;

    const promptTokens = countTokens(prompt);
    if (promptTokens > 3500) {
      throw new Error("Превышено количество токенов в запросе.");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Вы - HR-специалист, оценивающий кандидатов на техническую должность в буткемп. Он проходит среди людей 16-22 лет. Вы должны принять хотя бы топовых. Смотрите на эти критерии, это лишь 1 этап, после него тех. задание и интервью. А такж, если специальность другая (не айти), но хотя бы база знаний есть - это приоритет, но людей со знаниями тоже упускать нельзя.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      n: 1,
      temperature: 0.7,
    });

    const result = response.choices[0].message?.content?.trim() || "";
    console.log("Ответ OpenAI:", result);

    const verdicts: string[] = [];
    const justifications: string[] = [];

    const regex =
      /(\d+)\.\s*Вердикт:\s*(Подходит|Не подходит)\s*Обоснование:\s*(.*)/g;
    let match;
    while ((match = regex.exec(result)) !== null) {
      verdicts[parseInt(match[1], 10) - 1] = match[2];
      justifications[parseInt(match[1], 10) - 1] = match[3];
    }

    return { verdicts, justifications };
  } catch (error) {
    console.error("Ошибка при получении вердиктов ИИ:", error);
    return {
      verdicts: [],
      justifications: [],
    };
  }
}

export async function processDataWithAI(
    data: SheetData[]
  ): Promise<SheetData[]> {
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
  
    let allVerdicts: string[] = [];
    let allJustifications: string[] = [];
  
    for (const chunk of chunks) {
      const candidatesInfo = chunk
        .map(
          (item, index) =>
            `${index + 1}. Имя: ${item.name}, Опыт: ${item.experience}, Университет: ${item.university}, Специализация: ${item.specialization}`
        )
        .join("\n");
  
      const { verdicts, justifications } = await getAIVerdicts(candidatesInfo);
      
      // Проверяем, что вердикты и обоснования имеют правильный формат
      const validVerdicts = verdicts.map(v => v === "Подходит" ? "Подходит" : "Не подходит");
      const validJustifications = justifications.map(j => j || "Нет обоснования");
  
      allVerdicts = allVerdicts.concat(validVerdicts);
      allJustifications = allJustifications.concat(validJustifications);
    }
  
    return data.map((item, index) => ({
      ...item,
      aiVerdict: allVerdicts[index] || "Не определено",
      aiJustification: allJustifications[index] || "Нет обоснования",
      aiReviewed: true,
    }));
}