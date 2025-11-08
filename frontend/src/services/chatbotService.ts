import chatClient from "./chatClient";

export const chatbotService = {
    askQuestion: async (courseId: string, question: string) => {
        const response = await chatClient.post("/chatbot-api/chat", {
            courseId,
            question,
        });
        return response.data;
    },
};

export const ingestDocuments = async (data: any) => {
    try {
        const response = await chatClient.post("/chatbot-api/ingest", {
            ...data,
        });
        return response.data;
    } catch (error: any) {
        console.error("Error ingesting documents:", error);
        throw new Error("Failed to ingest documents");
    }
};
