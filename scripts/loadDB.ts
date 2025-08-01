import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} = process.env;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY! });

const f1Data = [
    'https://en.wikipedia.org/wiki/Formula_One',
    'https://www.formula1.com/en/latest',
    'https://www.bbc.com/sport/formula1',
    'https://www.theguardian.com/sport/formulaone',
    'https://www.formula1.com/en/racing/2022',
    'https://www.formula1.com/en/racing/2023',
    'https://www.formula1.com/en/racing/2024',
    'https://www.skysports.com/f1'
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { namespace: ASTRA_DB_NAMESPACE! });

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
});

// First define scrapePage
const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: { headless: true },
        gotoOptions: { waitUntil: "domcontentloaded" },
        evaluate: async (page) => {
            return await page.evaluate(() => document.body.innerHTML);
        }
    });

    const raw = await loader.load();
    return raw?.[0]?.pageContent?.replace(/<[^>]*>?/gm, '') || '';
};

// Then define loadSampleData
const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION!);

    for (const url of f1Data) {
        try {
            const content = await scrapePage(url);
            const chunks = await splitter.splitText(content);
            for (const chunk of chunks) {
                const embedding = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: chunk,
                    encoding_format: "float"
                });

                const vector = embedding.data[0].embedding;

                const res = await collection.insertOne({
                    $vector: vector,
                    text: chunk
                });

                console.log(`Inserted chunk from ${url}:`, res);
            }
        } catch (err) {
            console.error(`Error scraping or inserting for ${url}:`, err);
        }
    }
};

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    try {
        const res = await db.createCollection(ASTRA_DB_COLLECTION!, {
            vector: {
                dimension: 1536,
                metric: similarityMetric
            }
        });
        console.log("Collection created:", res);
    } catch (err) {
        console.warn("Collection might already exist:", err.message || err);
    }
};

// Execute
(async () => {
    await createCollection();
    await loadSampleData();
})();
