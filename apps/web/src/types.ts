export type Bots = {
    id: string;
    model: string;
    profile_image: string;
    name: string;
    userId: string;
    temperature: number;
    prompt_template: string;
    description: string | null;
    theme: Theme;
    private: boolean;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    kb: KnowledgeBase;
  }
  
  interface KnowledgeBase {
    id: string;
    userId: string;
    botId: string;
    csv: string[]; // list of CSV file URLs (empty here)
    pdf: string[]; // list of PDF file URLs
    web_url: string[]; // list of web URLs
    json: string[]; // list of JSON file URLs
    txt: string[]; // list of TXT file URLs
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
  }
  type Theme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'pink' | 'indigo' | 'gray' | 'default';
