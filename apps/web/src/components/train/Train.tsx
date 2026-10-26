"use client";
import React, { useEffect, useState } from "react";
import FileUploader from "./FileUploader";
import axios from "axios";
import { AUTH_BASE_URL, NEXT_JS_PROXY_URL } from "@/const";
import { Button } from "../ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {nanoid} from 'nanoid'
import { useAuth } from "@/context/AuthContext";
import { MultiStepLoader } from "../ui/multi-step-loader";
import BotTrainingSuccess from "../sucesss/Success";
import BotTrainingFailed from "../error/ErrorTraining";
import { newPrivateChat } from "@/lib/utils";
import ApiClient from "@/lib/ApiClient";
import { useRouter } from "next/navigation";

// Type definitions
interface AIModel {
  provider: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface BotMetadata {
  name: string;
  description: string;
  tags: string[];
}

interface AIConfig {
  selectedProvider: string;
  selectedModel: string;
  useCustomAPIKey: boolean;
  apiKey: string;
  temperature: number;
}

interface UploadResponse {
  success: boolean;
  files: {
    id: string;
    fileUrl: string;
    fileType: string;
  }[];
  urls?: string[];
}

interface FileSelection {
  [key: string]: File[];
}

const loadingStates = [
  {
    text: "Uploading files",
  },
  {
    text: "Scraping pages", // Changed from "Processing files"
  },
  {
    text: "Creating Bot",
  },
];

const AITrainingPage = () => {
  // Bot metadata state
  const [botMetadata, setBotMetadata] = useState<BotMetadata>({
    name: "",
    description: "",
    tags: [],
  });
  const [currentState, setCurrentState] = useState(-1);
  const { userId } = useAuth();
  const [botId, setBotId] = useState<string | null>(null);
  const [kbId, setKbId] = useState<string | null>(null)
  const router = useRouter();
  // Tag input state
  const [tagInput, setTagInput] = useState("");

  // AI configuration state
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    selectedProvider: "gemini",
    selectedModel: "gemini-pro",
    useCustomAPIKey: false,
    apiKey: "",
    temperature: 0.7,
  });

  // Prompt template state
  const [promptTemplate, setPromptTemplate] = useState("");

  // Training status
  const [trainingStatus, setTrainingStatus] = useState<
    null | "pending" | "success" | "error"
  >(null);
  const [trainingMessage, setTrainingMessage] = useState("");

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<{
    csv: string[];
    pdf: string[];
    txt: string[];
    json: string[];
    web_url: string[];
  }>({
    csv: [],
    pdf: [],
    txt: [],
    json: [],
    web_url: [],
  });

  const [selectedFiles, setSelectedFiles] = useState<FileSelection>({
    csv: [],
    json: [],
    pdf: [],
    txt: [],
  });
  const [enteredUrls, setEnteredUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  // Available AI models
  const aiModels: AIModel[] = [
    {
      provider: "gemini",
      name: "gemini-pro",
      description: "Balanced model for general tasks",
      enabled: true,
    },
    {
      provider: "gemini",
      name: "gemini-ultra",
      description: "Advanced model for complex reasoning",
      enabled: true,
    },
    {
      provider: "openai",
      name: "gpt-4",
      description: "Advanced reasoning and instructions",
      enabled: false,
    },
    {
      provider: "claude",
      name: "claude-3-opus",
      description: "Highest capability Claude model",
      enabled: false,
    },
    {
      provider: "grok",
      name: "grok-1",
      description: "General purpose AI assistant",
      enabled: false,
    },
    {
      provider: "deepseek",
      name: "deepseek-coder",
      description: "Specialized for coding tasks",
      enabled: false,
    },
  ];

  // Handle tag addition
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      if (!botMetadata.tags.includes(tagInput.trim())) {
        setBotMetadata({
          ...botMetadata,
          tags: [...botMetadata.tags, tagInput.trim()],
        });
      }
      setTagInput("");
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setBotMetadata({
      ...botMetadata,
      tags: botMetadata.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  // Handle form input changes
  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBotMetadata({
      ...botMetadata,
      [name]: value,
    });
  };

  // Handle AI config changes
  const handleAIConfigChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : type === "number"
        ? parseFloat(value)
        : value;

    setAIConfig({
      ...aiConfig,
      [name]: newValue,
    });
  };

  useEffect(() => {
    const fileCount = Object.values(selectedFiles).reduce(
      (acc, files) => acc + files.length,
      0
    );
    setTotalFiles(fileCount + enteredUrls.length);
  }, [selectedFiles, enteredUrls]);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles((prev) => ({
        ...prev,
        [type]: [...(prev[type] || []), ...newFiles],
      }));
    }
  };

  const removeFile = (type: string, index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev[type]];
      newFiles.splice(index, 1);
      return {
        ...prev,
        [type]: newFiles,
      };
    });
  };

  const handleAddUrl = () => {
    const isValidUrl = /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(
      urlInput.trim()
    );
    if (!isValidUrl) {
      setUploadStatus("Please enter a valid URL.");
      return;
    }
    if (totalFiles >= 3) {
      setUploadStatus("You can upload a maximum of 3 items in total.");
      return;
    }
    setEnteredUrls((prev) => [...prev, urlInput.trim()]);
    setUrlInput("");
    setUploadStatus(null);
  };

  const removeUrl = (index: number) => {
    setEnteredUrls((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };
  
  // Handle file upload response
  const handleUploadResponse = (response: UploadResponse) => {
    const newUploadedFiles = { ...uploadedFiles };

    // Process uploaded files
    response.files.forEach((file) => {
      switch (file.fileType) {
        case "csv":
          newUploadedFiles.csv.push(file.fileUrl);
          break;
        case "pdf":
          newUploadedFiles.pdf.push(file.fileUrl);
          break;
        case "txt":
          newUploadedFiles.txt.push(file.fileUrl);
          break;
        case "json":
          newUploadedFiles.json.push(file.fileUrl);
          break;
      }
    });

    // Process URLs if any
    if (response.urls) {
      newUploadedFiles.web_url = [
        ...newUploadedFiles.web_url,
        ...response.urls,
      ];
    }

    setUploadedFiles(newUploadedFiles);
    return newUploadedFiles;
  };

  // Helper function to check if there are any selected files
  const hasSelectedFiles = () => {
    return Object.values(selectedFiles).some(files => files.length > 0);
  };

  // Start training
  const handleStartTraining = async () => {
    // Validate required fields
    if (!botMetadata.name.trim()) {
      setTrainingStatus("error");
      setTrainingMessage("Bot name is required");
      return;
    }

    if (aiConfig.useCustomAPIKey && !aiConfig.apiKey.trim()) {
      setTrainingStatus("error");
      setTrainingMessage("API key is required when using custom keys");
      return;
    }

    // Set training status to pending
    setTrainingStatus("pending");
    
    const bot_id = nanoid();
    const kb_id = nanoid()
    const generatedBotId = `${bot_id}`;
    const generatedKbId = `${kb_id}`;
    setBotId(generatedBotId);
    setKbId(generatedKbId);

    try {
      let processedFiles = { ...uploadedFiles };

      // Check if we have files to upload
      if (hasSelectedFiles()) {
        // Step 1: Upload files
        setTrainingMessage("Uploading files...");
        setCurrentState(0);

        const formData = new FormData();

        // Add files to formData
        for (const [type, files] of Object.entries(selectedFiles)) {
          files.forEach((file) => formData.append(type, file));
        }

        const queryParams = new URLSearchParams({
          user_id: userId!,
          bot_id: generatedBotId,
          kb_id: generatedKbId,
        });

        const uploadResponse = await axios.post<UploadResponse>(
          `/api/v1/upload?${queryParams.toString()}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      
        if (!uploadResponse.data.success) {
          throw new Error("File upload failed");
        }

        // Process the uploaded files
        processedFiles = handleUploadResponse(uploadResponse.data);
      }

      // Step 2: Scraping pages (if URLs exist) or processing files
      if (enteredUrls.length > 0) {
        setTrainingMessage("Scraping pages...");
        setCurrentState(1);
        // Add URLs to processedFiles
        processedFiles.web_url = [...processedFiles.web_url, ...enteredUrls];
      } else if (hasSelectedFiles()) {
        setTrainingMessage("Processing files...");
        setCurrentState(1);
      }

      // Step 3: Create bot
      setTrainingMessage("Creating bot...");
      setCurrentState(2);
      
      const botCreationData = {
        user_id: userId,
        bot_id: generatedBotId,
        kb_id: generatedKbId,
        csv: processedFiles.csv.length > 0 ? processedFiles.csv : undefined,
        pdf: processedFiles.pdf.length > 0 ? processedFiles.pdf : undefined,
        txt: processedFiles.txt.length > 0 ? processedFiles.txt : undefined,
        json: processedFiles.json.length > 0 ? processedFiles.json : undefined,
        web_url: processedFiles.web_url.length > 0 ? processedFiles.web_url : undefined,
        prompt_template: promptTemplate || undefined,
        temperature: aiConfig.temperature,
        bot_name: botMetadata.name,
        model: aiConfig.selectedModel,
        // Additional data that could be included
        description: botMetadata.description || undefined,
        tags: botMetadata.tags.length > 0 ? botMetadata.tags : undefined,
        api_key: aiConfig.useCustomAPIKey ? aiConfig.apiKey : undefined,
      };

      await axios.post(
        `/api/v1/bot/create`,
        botCreationData,
        { withCredentials: true }
      );

      // Handle successful creation
      setTrainingStatus("success");
      setTrainingMessage(`Bot "${botMetadata.name}" successfully trained!`);

      // You could navigate to a bot details page or dashboard here
      // window.location.href = `/bots/${createBotResponse.data.bot_id}`;
    } catch (error: any) {
      console.error("Training error:", error);
      setTrainingStatus("error");
      setTrainingMessage(
        `Training failed: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setCurrentState(-1);
    }
  };
  async function handleGoToChat() {
    router.push(`/chat/${botId}/${kbId}`)
  }

  if (trainingStatus === "pending"){
    return <MultiStepLoader loadingStates={loadingStates} loading={trainingStatus === "pending"} curr={currentState} />
  }

  if (trainingStatus === "success") {
    return <BotTrainingSuccess botId={botId} botName={botMetadata.name} kbId={kbId} onGoToChat={handleGoToChat} />
  }

  if (trainingStatus === "error") {
    return <BotTrainingFailed errorMessage={trainingMessage} botName={botMetadata.name} />;
  }
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Create</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Section 1: Bot Metadata */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Bot Information</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bot Name *
            </label>
            <input
              type="text"
              name="name"
              value={botMetadata.name}
              onChange={handleMetadataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter bot name"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={botMetadata.description}
              onChange={handleMetadataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what your bot does"
              rows={3}
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add tags and press Enter"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {botMetadata.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Section 2: AI Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">AI Configuration</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Provider
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {["gemini", "openai", "claude", "grok", "deepseek"].map(
                (provider) => (
                  <div
                    key={provider}
                    className={`
                    border rounded-md p-3 cursor-pointer transition-all
                    ${
                      provider === "gemini"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 opacity-50"
                    }
                  `}
                    onClick={() =>
                      provider === "gemini" &&
                      setAIConfig({ ...aiConfig, selectedProvider: provider })
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{provider}</span>
                      {provider !== "gemini" && (
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                          Disabled
                        </span>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              name="selectedModel"
              value={aiConfig.selectedModel}
              onChange={handleAIConfigChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {aiModels
                .filter(
                  (model) =>
                    model.provider === aiConfig.selectedProvider &&
                    model.enabled
                )
                .map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name} - {model.description}
                  </option>
                ))}
            </select>
          </div>

          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useCustomAPIKey"
                name="useCustomAPIKey"
                checked={aiConfig.useCustomAPIKey}
                onChange={handleAIConfigChange}
                className="mr-2 h-4 w-4"
              />
              <label
                htmlFor="useCustomAPIKey"
                className="text-sm font-medium text-gray-700"
              >
                Use custom API key
              </label>
            </div>
          </div>

          {aiConfig.useCustomAPIKey && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                name="apiKey"
                value={aiConfig.apiKey}
                onChange={handleAIConfigChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your API key"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature: {aiConfig.temperature}
            </label>
            <input
              type="range"
              name="temperature"
              min="0"
              max="1"
              step="0.1"
              value={aiConfig.temperature}
              onChange={handleAIConfigChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Precise (0.0)</span>
              <span>Balanced (0.5)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>
        </div>

        {/* Section 3: File Upload */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Training Data</h2>
          <div className="bg-white rounded-lg max-w-5xl">
            <p className="text-gray-500 mb-6">
              Upload a file (PDF, DOCX, TXT, CSV, Excel, PowerPoint) to generate
              exam questions
            </p>

            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 flex items-center text-gray-700">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                Document Upload
              </h3>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 flex flex-col items-center justify-center text-center">
                <svg
                  className="w-12 h-12 text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <p className="text-gray-600 mb-2 font-medium">Drag files</p>
                <p className="text-gray-500 text-sm mb-4">
                  Click to upload files (PDF, DOCX, TXT, CSV, Excel, PowerPoint)
                </p>

                <div className="flex space-x-3">
                  {Object.keys(selectedFiles).map((type) => (
                    <div key={type} className="flex-1">
                      <label className="px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-sm shadow-sm flex items-center justify-center">
                        <svg
                          className="h-4 w-4 mr-1 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"
                          />
                        </svg>
                        {type.toUpperCase()}
                        <input
                          type="file"
                          name={type}
                          accept={`.${type}`}
                          multiple
                          onChange={(e) => handleFileChange(e, type)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Uploaded Files */}
            {Object.values(selectedFiles).some((files) => files.length > 0) && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-3 flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  Uploaded Files
                </h3>

                <div className="space-y-3">
                  {Object.entries(selectedFiles).map(([type, files]) =>
                    files.map((file, index) => (
                      <div
                        key={`${type}-${index}`}
                        className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-md border border-blue-100"
                      >
                        <div className="flex items-center">
                          <div className="bg-blue-500 rounded-md p-2 mr-3">
                            <svg
                              className="h-5 w-5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <span className="text-gray-800 font-medium">
                              {file.name}
                            </span>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <span className="mr-2">
                                {Math.round(file.size / 1024)} KB
                              </span>
                              <span className="flex items-center bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  ></path>
                                </svg>
                                Ready
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(type, index)}
                          className="text-gray-500 hover:text-red-500 transition-colors p-1"
                          aria-label="Remove file"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* URL Input Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3 flex items-center text-gray-700">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.828 10.172a4 4 0 010 5.656m1.414-1.414a6 6 0 000-8.485l-3.535 3.535a2 2 0 010 2.828l3.535 3.536a6 6 0 000-8.485m-8.485 8.485a4 4 0 015.656 0"
                  ></path>
                </svg>
                URL Input
              </h3>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                  placeholder="Enter a valid URL (e.g., https://example.com)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <Button
                  onClick={handleAddUrl}
                  disabled={totalFiles >= 3}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                >
                  Add URL
                </Button>
              </div>

              {enteredUrls.length > 0 && (
                <div className="space-y-3">
                  {enteredUrls.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-md border border-gray-200"
                    >
                      <div className="flex items-center truncate w-4/5">
                        <div className="bg-gray-200 rounded-md p-2 mr-3">
                          <svg
                            className="h-5 w-5 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 010 5.656m1.414-1.414a6 6 0 000-8.485l-3.535 3.535a2 2 0 010 2.828l3.535 3.536a6 6 0 000-8.485m-8.485 8.485a4 4 0 015.656 0"
                            />
                          </svg>
                        </div>
                        <span className="truncate text-gray-700">{url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUrl(index)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
                        aria-label="Remove URL"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* File Counter */}
            <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex items-center mb-2">
                <span className="font-medium text-gray-700 mr-2">
                  Items uploaded:
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                  {totalFiles}/3
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: `${Math.min(100, (totalFiles / 3) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Additional Options */}

            {/* Status Messages */}
            {uploadStatus && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  uploadStatus.includes("failed")
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-green-50 text-green-800 border border-green-200"
                }`}
              >
                <div className="flex items-center">
                  {uploadStatus.includes("failed") ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {uploadStatus}
                </div>
              </div>
            )}

            {/* Add hidden inputs for URLs */}
            {enteredUrls.map((url, index) => (
              <input key={index} type="hidden" name="urls" value={url} />
            ))}
          </div>
        </div>

        {/* Section 4: Prompt Template */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Prompt Template</h2>
          <textarea
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your prompt template here. Use {{variables}} for dynamic content."
            rows={8}
          />
          <div className="mt-2 text-sm text-gray-500">
            {`You can use variables like {{context}}, {{question}}, etc. The bot will replace these with actual values during conversations.`}
          </div>
        </div>

        {/* Training Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleStartTraining}
            className="bg-black text-white px-4 py-2 rounded-md"
          >
            Start Training
          </Button>
        </div>

      </div>
    </div>
  );
};

export default AITrainingPage;
