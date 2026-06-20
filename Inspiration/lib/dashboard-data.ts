export type Citation = {
  page: number
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: Citation[]
}

export type ResearchDocument = {
  id: string
  name: string
  chats: number
}

export type RecentChat = {
  id: string
  preview: string
}

export const documents: ResearchDocument[] = [
  { id: "attention", name: "attention_is_all_you_need.pdf", chats: 4 },
  { id: "bert", name: "bert_paper.pdf", chats: 2 },
  { id: "gpt4", name: "gpt4_technical_report.pdf", chats: 7 },
  { id: "lora", name: "lora_low_rank_adaptation.pdf", chats: 1 },
]

export const recentChats: RecentChat[] = [
  { id: "1", preview: "What is the main contribution of this paper?" },
  { id: "2", preview: "Summarize the methodology section" },
  { id: "3", preview: "Explain the attention mechanism" },
  { id: "4", preview: "What datasets were used for evaluation?" },
  { id: "5", preview: "What are the key limitations?" },
]

export const suggestedQuestions = [
  "What problem does this paper solve?",
  "Explain the attention mechanism",
  "What are the limitations?",
]

export const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "Can you explain the attention mechanism used in this paper?",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "The paper introduces scaled dot-product attention, where queries and keys are multiplied, scaled by the square root of their dimension, and passed through a softmax to weight the values. Multi-head attention runs several of these in parallel so the model can attend to information from different representation subspaces at once. This removes the need for recurrence entirely while capturing long-range dependencies. The result is a highly parallelizable architecture that trains faster than RNN-based models.",
    citations: [{ page: 3 }, { page: 5 }],
  },
]

// A small pool of canned responses used for the mock interaction.
export const mockResponses: { content: string; citations: Citation[] }[] = [
  {
    content:
      "The core contribution is the Transformer architecture, which relies entirely on self-attention and dispenses with recurrence and convolutions. This enables significantly more parallelization and reduces training time while achieving state-of-the-art translation quality.",
    citations: [{ page: 1 }, { page: 2 }],
  },
  {
    content:
      "The authors evaluate on the WMT 2014 English-to-German and English-to-French translation tasks, reporting BLEU scores that exceed previous best results, including ensembles, at a fraction of the training cost.",
    citations: [{ page: 8 }],
  },
  {
    content:
      "A noted limitation is that self-attention has quadratic complexity with respect to sequence length, which can be costly for very long sequences. The authors suggest restricted attention as a possible direction for future work.",
    citations: [{ page: 6 }, { page: 9 }],
  },
]
